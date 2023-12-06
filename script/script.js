const API_URL = "https://workspace-methed.vercel.app/";
const LOCATIONS_URL = "api/locations";
const VACANCY_URL = "api/vacancy";

const cardsList = document.querySelector(".cards__list");
const pagination = {}

let lastUrl = "";

const getData = async (url, cbSuccess, cbError) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    cbSuccess(data)
  } catch (err) {
    cbError(err)
  }
};

const createCard = vacancy => `
  <article class="vacancy" tabindex="0" data-id="${vacancy.id}">
    <img class="vacancy__img" src="${API_URL}/${vacancy.logo}" alt="Логотип компании ${vacancy.company}">
    <p class="vacancy__company">${vacancy.company}</p>
    <h3 class="vacancy__title">${vacancy.title}</h3>
    <ul class="vacancy__fields">
      <li class="vacancy__field">от ${parseInt(vacancy.salary).toLocaleString()} ₽</li>
      <li class="vacancy__field">${vacancy.type}</li>
      <li class="vacancy__field">${vacancy.format}</li>
      <li class="vacancy__field">${vacancy.experience}</li>
    </ul>
  </article>
`

const createCards = data => data.vacancies.map(vacancy => {
  const li = document.createElement("li");
  li.classList.add("card__item");
  li.insertAdjacentHTML("beforeend", createCard(vacancy));
  return li;
})

const renderVacancies = (data) => {
  cardsList.textContent = "";
  const cards = createCards(data);
  cardsList.append(...cards);

  if (data.pagination) {
    Object.assign(pagination, data.pagination);
  }

  observer.observe(cardsList.lastElementChild);
}

const renderMoreVacancies = (data) => {
  const cards = createCards(data);
  cardsList.append(...cards);

  if (data.pagination) {
    Object.assign(pagination, data.pagination);
  }

  observer.observe(cardsList.lastElementChild);
}

const loadMoreVacancies = () => {
  if (pagination.totalPages > pagination.currentPage) {
    const urlWithParams = new URL(lastUrl);
    urlWithParams.searchParams.set('page', pagination.currentPage + 1);
    urlWithParams.searchParams.set('limit', window.innerWidth < 768 ? 6 : 12);

    getData(urlWithParams, renderMoreVacancies, renderError).then(() => lastUrl = urlWithParams);
  }
}

const renderError = err => {
  console.warn(err)
}

const createDetailVacancy = ({
                               id, title, company, description, email, salary, type, format, experience, location, logo
                             }) => `
  <article class="detail">
    <div class="detail__header">
      <img src="${API_URL}${logo}" alt="Логотип компании ${company}" class="detail__logo">

      <p class="detail__company">${company}</p>

      <h2 class="detail__title">${title}</h2>
    </div>

    <div class="detail__main">
      <div class="detail__description">${description.replaceAll("\n", "<br/>")}</div>

      <ul class="detail__fields">
        <li class="detail__field">от ${parseInt(salary).toLocaleString()} ₽</li>
        <li class="detail__field">${type}</li>
        <li class="detail__field">${format}</li>
        <li class="detail__field">${experience}</li>
        <li class="detail__field">${location}</li>
      </ul>
    </div>
    
    <p class="detail__resume">Отправляйте резюме на
        <a href="mailto:${email}" class="blue-text">${email}</a>    
    </p>
  </article>
`

const modal = document.querySelector(".modal");
const scrollbarWidth = window.innerWidth - document.body.clientWidth;
document.documentElement.style.setProperty("--scrollbarWidth", `${scrollbarWidth}px`);

const renderModal = data => {
  const modalMain = modal.querySelector(".modal__main");
  modalMain.innerHTML = createDetailVacancy(data);
  modal.showModal();
  document.body.classList.add("scroll-lock");
}

const openModal = (id) => {
  getData(`${API_URL}${VACANCY_URL}/${id}`, renderModal, renderError)
}

const closeModal = ({currentTarget, target}) => {
  const modalEl = currentTarget;
  const isClickedOnBackDrop = target === modalEl
  if (isClickedOnBackDrop) {
    modalEl.close()
    document.body.classList.remove("scroll-lock");
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadMoreVacancies();
      }
    })
  }, {
    rootMargin: "100px",
  }
)

const init = () => {
  const filterForm = document.querySelector(".filter__form");

  // Select city
  const selectCity = document.querySelector("#city");
  const choicesCity = new Choices(selectCity, {
    itemSelectText: ""
  })

  getData(
    `${API_URL}${LOCATIONS_URL}`,
    (citiesData) => {
      const cities = citiesData.map(city => ({value: city}))
      choicesCity.setChoices(cities, 'value', 'label', true)
    },
    renderError
  );

  // Cards
  const urlWithParams = new URL(`${API_URL}${VACANCY_URL}`);

  urlWithParams.searchParams.set('limit', window.innerWidth < 768 ? 6 : 12);
  urlWithParams.searchParams.set('page', 1);

  getData(urlWithParams, renderVacancies, renderError).then(() => lastUrl = urlWithParams);

  // Modal
  cardsList.addEventListener("click", ({target}) => {
    const vacancyCard = target.closest(".vacancy");
    if (vacancyCard) {
      const vacancyId = vacancyCard.dataset.id;
      openModal(vacancyId);
    }
  })

  modal.addEventListener("click", closeModal);

  // Filter
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(filterForm);

    const urlWithParam = new URL(`${API_URL}${VACANCY_URL}`);

    formData.forEach((value, key) => {
      urlWithParam.searchParams.append(key, value);
    });

    getData(urlWithParam, renderVacancies, renderError).then(() => {
      lastUrl = urlWithParam;
      observer.observe(cardsList)
    });
  })
}

init();