document.addEventListener('DOMContentLoaded', function() {
    // Функция очистки введенного значения
    function cleanValue(value) {
        if (value === null || value === undefined || typeof value !== 'string' || value.trim() === '') {
            return '';
        }
        return value.trim()
            .replace(/[^а-яА-ЯёЁa-zA-Z0-9\s.\-_:\/\\?&=#%]/g, '')
            .replace(/\s+/g, ' ');
    }

    // Функция проверки на повторяющиеся спецсимволы
    function hasNoLongRepeatsNoRegex(value) {
        const specialChars = ['.', '-', '_', ':', '/', '\\', '?', '&', '=', '#', '%'];
        let count = 1;
        for (let i = 1; i < value.length; i++) {
            if (value[i] === value[i - 1] && specialChars.includes(value[i])) {
                count++;
                if (count >= 3) {
                    return false;
                }
            } else {
                count = 1;
            }
        }
        return true;
    }

    // Функция отображения ошибки
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'inline-block';
    }

    // Функция скрытия ошибки
    function hideError(element) {
        element.style.display = 'none';
    }

    // Получение элементов формы и ошибок
    const form = document.forms.VALID;
    const developers = form.elements.developers;
    const siteName = form.elements['site-name'];
    const launchDate = form.elements['launch-date'];
    const sub = form.elements.sub;
    const rubrick = form.elements.rubrick;
    const accommodation = form.elements.accommodation;
    const reviews = form.elements.reviews;
    const description = form.elements.description;

    const errorDevelopers = document.getElementById('error-developers');
    const errorSiteName = document.getElementById('error-site-name');
    const errorLaunchDate = document.getElementById('error-launch-date');
    const errorSub = document.getElementById('error-sub');
    const errorRubrick = document.getElementById('error-rubrick');
    const errorAccommodation = document.getElementById('error-accommodation');
    const errorReviews = document.getElementById('error-reviews');
    const errorDescription = document.getElementById('error-description');

    // Функция валидации формы
    function validateInfoForm(eo) {
        eo.preventDefault();

        try {
            // Сброс всех ошибок перед проверкой
            errorDevelopers.style.display = 'none';
            errorSiteName.style.display = 'none';
            errorLaunchDate.style.display = 'none';
            errorSub.style.display = 'none';
            errorRubrick.style.display = 'none';
            errorAccommodation.style.display = 'none';
            errorReviews.style.display = 'none';
            errorDescription.style.display = 'none';

            // Массив для хранения ошибок
            const errors = [];
            let firstErrorField = null;

            // Валидация поля "Разработчики"
            const cleanDeveloperValue = cleanValue(developers.value);
            if (!cleanDeveloperValue) {
                errors.push({ element: errorDevelopers, message: 'Вы ничего не ввели' });
                if (!firstErrorField) firstErrorField = developers;
            } else if (!hasNoLongRepeatsNoRegex(cleanDeveloperValue)) {
                errors.push({ element: errorDevelopers, message: 'Ввод содержит недопустимые повторяющиеся спецсимволы (3 и более подряд)' });
                if (!firstErrorField) firstErrorField = developers;
            } else if (cleanDeveloperValue.length > 30) {
                errors.push({ element: errorDevelopers, message: 'Введите имя и фамилию (псевдоним) не длиннее 30 символов' });
                if (!firstErrorField) firstErrorField = developers;
            } else if (cleanDeveloperValue.length < 3) {
                errors.push({ element: errorDevelopers, message: 'Вы ввели слишком короткое имя' });
                if (!firstErrorField) firstErrorField = developers;
            }

            // Валидация поля "Название сайта"
            const cleanSiteNameValue = cleanValue(siteName.value);
            if (!cleanSiteNameValue) {
                errors.push({ element: errorSiteName, message: 'Вы ничего не ввели' });
                if (!firstErrorField) firstErrorField = siteName;
            } else if (!hasNoLongRepeatsNoRegex(cleanSiteNameValue)) {
                errors.push({ element: errorSiteName, message: 'Ввод содержит недопустимые повторяющиеся спецсимволы (3 и более подряд)' });
                if (!firstErrorField) firstErrorField = siteName;
            } else if (cleanSiteNameValue.length > 50) {
                errors.push({ element: errorSiteName, message: 'Введите URL сайта не длиннее 50 символов' });
                if (!firstErrorField) firstErrorField = siteName;
            } else if (cleanSiteNameValue.length < 3) {
                errors.push({ element: errorSiteName, message: 'Вы ввели слишком короткое название' });
                if (!firstErrorField) firstErrorField = siteName;
            }

            // Валидация поля "Дата запуска"
            const today = new Date();
            const selectedDate = new Date(launchDate.value);
            const minYear = new Date('1990-01-01');
            if (!launchDate.value) {
                errors.push({ element: errorLaunchDate, message: 'Пожалуйста, выберите дату' });
                if (!firstErrorField) firstErrorField = launchDate;
            } else if (selectedDate > today) {
                errors.push({ element: errorLaunchDate, message: 'Дата не может быть в будущем' });
                if (!firstErrorField) firstErrorField = launchDate;
            } else if (selectedDate < minYear) {
                errors.push({ element: errorLaunchDate, message: 'Дата слишком ранняя (не ранее 1990 года)' });
                if (!firstErrorField) firstErrorField = launchDate;
            }

            // Валидация поля "Посетителей за сутки"
            const cleanSubValue = cleanValue(sub.value);
            if (!cleanSubValue) {
                errors.push({ element: errorSub, message: 'Вы ничего не ввели' });
                if (!firstErrorField) firstErrorField = sub;
            } else if (!hasNoLongRepeatsNoRegex(cleanSubValue)) {
                errors.push({ element: errorSub, message: 'Ввод содержит недопустимые повторяющиеся спецсимволы (3 и более подряд)' });
                if (!firstErrorField) firstErrorField = sub;
            } else if (!/^\d+$/.test(cleanSubValue)) {
                errors.push({ element: errorSub, message: 'Введите только целое число' });
                if (!firstErrorField) firstErrorField = sub;
            } else {
                const subValue = parseInt(cleanSubValue, 10);
                if (subValue > 100000) {
                    errors.push({ element: errorSub, message: 'Мы не верим, что у вас такое большое количество посетителей' });
                    if (!firstErrorField) firstErrorField = sub;
                }
            }

            // Валидация поля "Рубрика каталога"
            const rubrickValue = rubrick.value;
            if (!rubrickValue) {
                errors.push({ element: errorRubrick, message: 'Пожалуйста выберите рубрику' });
                if (!firstErrorField) firstErrorField = rubrick;
            } else if (rubrickValue === 'house') {
                errors.push({ element: errorRubrick, message: 'Извините данная рубрика пока что не доступна' });
                if (!firstErrorField) firstErrorField = rubrick;
            }

            // Валидация поля "Размещение"
            const accommodationValue = Array.from(accommodation).find(radio => radio.checked)?.value;
            if (!accommodationValue) {
                errors.push({ element: errorAccommodation, message: 'Пожалуйста выберите размещение' });
                if (!firstErrorField) firstErrorField = accommodation[0];
            } else if (accommodationValue === 'free') {
                errors.push({ element: errorAccommodation, message: 'Выберите другое размещение, бесплатно пока что не доступно' });
                if (!firstErrorField) firstErrorField = accommodation[0];
            }

            // Валидация поля "Разрешить отзывы"
            const reviewsValue = reviews.checked;
            if (!reviewsValue) {
                errors.push({ element: errorReviews, message: 'Вы не согласились с правилами сайта' });
                if (!firstErrorField) firstErrorField = reviews;
            }

            // Валидация поля "Описание сайта"
            const descriptionValue = cleanValue(description.value); 
            if (!descriptionValue) {
                errors.push({ element: errorDescription, message: 'Введите описание сайта' });
                if (!firstErrorField) firstErrorField = description;
            } else if (descriptionValue.length < 500) {
                errors.push({ element: errorDescription, message: 'Описание сайта не может быть меньше 500 символов' });
                if (!firstErrorField) firstErrorField = description;
            }

            // Отображение всех ошибок
            errors.forEach(error => showError(error.element, error.message));

            // Скролл и фокусировка на первое ошибочное поле
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
                return;
            }

            // Если ошибок нет, отправляем форму
            if (errors.length === 0) {
                form.submit();
            }

        } catch (ex) {
            console.error('Ошибка валидации:', ex);
            showError(errorDescription, 'Произошла ошибка. Попробуйте снова.');
        }
    }

    // Добавление слушателей событий для скрытия ошибок при редактировании
    developers.addEventListener('input', () => hideError(errorDevelopers));
    siteName.addEventListener('input', () => hideError(errorSiteName));
    launchDate.addEventListener('input', () => hideError(errorLaunchDate));
    sub.addEventListener('input', () => hideError(errorSub));
    rubrick.addEventListener('change', () => hideError(errorRubrick));
    Array.from(accommodation).forEach(radio => {
        radio.addEventListener('change', () => hideError(errorAccommodation));
    });
    reviews.addEventListener('change', () => hideError(errorReviews));
    description.addEventListener('input', () => hideError(errorDescription));

    // Добавление слушателя события на отправку формы
    form.addEventListener('submit', validateInfoForm, false);
});