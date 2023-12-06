const API_URL = "https://workspace-methed.vercel.app/";
const LOCATIONS_URL = "api/locations";
const VACANCY_URL = "api/vacancy";

const getData = async (url, cbSuccess, cbError) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data)
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

const renderVacancy = (data, cardsList) => {
  cardsList.textContent = "";
  const cards = createCards(data);
  cardsList.append(...cards);
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

const init = () => {
  const filterForm = document.querySelector(".filter__form");
  const cardsList = document.querySelector(".cards__list");

  // Select city
  const selectCity = document.querySelector("#city");
  const choicesCity = new Choices(selectCity, {
    searchEnabled: false, itemSelectText: ""
  })

  getData(`${API_URL}${LOCATIONS_URL}`, (citiesData) => {
    const cities = citiesData.map(city => ({value: city}))
    choicesCity.setChoices(cities, 'value', 'label', true)
  }, renderError);

  // Cards
  const urlVacancy = new URL(`${API_URL}${VACANCY_URL}`);

  getData(urlVacancy, (data) => renderVacancy(data, cardsList), renderError);

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

    getData(urlWithParam, (data) => renderVacancy(data, cardsList), renderError);
  })
}

init();