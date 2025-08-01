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

    // Валидация поля "Разработчики"
    function validateDevelopersField() {
        const cleanDeveloperValue = cleanValue(developers.value);
        if (!cleanDeveloperValue) {
            showError(errorDevelopers, 'Вы ничего не ввели');
            return false;
        } else if (!hasNoLongRepeatsNoRegex(cleanDeveloperValue)) {
            showError(errorDevelopers, 'Ввод содержит недопустимые повторяющиеся спецсимволы (3 и более подряд)');
            return false;
        } else if (cleanDeveloperValue.length > 30) {
            showError(errorDevelopers, 'Введите имя и фамилию (псевдоним) не длиннее 30 символов');
            return false;
        } else if (cleanDeveloperValue.length < 3) {
            showError(errorDevelopers, 'Вы ввели слишком короткое имя');
            return false;
        }
        hideError(errorDevelopers);
        return true;
    }

    // Валидация поля "Название сайта"
    function validateSiteNameField() {
        const cleanSiteNameValue = cleanValue(siteName.value);
        if (!cleanSiteNameValue) {
            showError(errorSiteName, 'Вы ничего не ввели');
            return false;
        } else if (!hasNoLongRepeatsNoRegex(cleanSiteNameValue)) {
            showError(errorSiteName, 'Ввод содержит недопустимые повторяющиеся спецсимволы (3 и более подряд)');
            return false;
        } else if (cleanSiteNameValue.length > 50) {
            showError(errorSiteName, 'Введите URL сайта не длиннее 50 символов');
            return false;
        } else if (cleanSiteNameValue.length < 3) {
            showError(errorSiteName, 'Вы ввели слишком короткое название');
            return false;
        }
        hideError(errorSiteName);
        return true;
    }

    // Валидация поля "Дата запуска"
    function validateLaunchDateField() {
        const today = new Date();
        const selectedDate = new Date(launchDate.value);
        const minYear = new Date('1990-01-01');
        if (!launchDate.value) {
            showError(errorLaunchDate, 'Пожалуйста, выберите дату');
            return false;
        } else if (selectedDate > today) {
            showError(errorLaunchDate, 'Дата не может быть в будущем');
            return false;
        } else if (selectedDate < minYear) {
            showError(errorLaunchDate, 'Дата слишком ранняя (не ранее 1990 года)');
            return false;
        }
        hideError(errorLaunchDate);
        return true;
    }

    // Валидация поля "Посетителей за сутки"
    function validateSubField() {
        const cleanSubValue = cleanValue(sub.value);
        if (!cleanSubValue) {
            showError(errorSub, 'Вы ничего не ввели');
            return false;
        } else if (!hasNoLongRepeatsNoRegex(cleanSubValue)) {
            showError(errorSub, 'Ввод содержит недопустимые повторяющиеся спецсимволы (3 и более подряд)');
            return false;
        } else if (!/^\d+$/.test(cleanSubValue)) {
            showError(errorSub, 'Введите только целое число');
            return false;
        } else {
            const subValue = parseInt(cleanSubValue, 10);
            if (subValue > 100000) {
                showError(errorSub, 'Мы не верим, что у вас такое большое количество посетителей');
                return false;
            }
        }
        hideError(errorSub);
        return true;
    }

    // Валидация поля "Рубрика каталога"
    function validateRubrickField() {
        const rubrickValue = rubrick.value;
        if (!rubrickValue) {
            showError(errorRubrick, 'Пожалуйста выберите рубрику');
            return false;
        } else if (rubrickValue === 'house') {
            showError(errorRubrick, 'Извините данная рубрика пока что не доступна');
            return false;
        }
        hideError(errorRubrick);
        return true;
    }

    // Валидация поля "Размещение"
    function validateAccommodationField() {
        const accommodationValue = Array.from(accommodation).find(radio => radio.checked)?.value;
        if (!accommodationValue) {
            showError(errorAccommodation, 'Пожалуйста выберите размещение');
            return false;
        } else if (accommodationValue === 'free') {
            showError(errorAccommodation, 'Выберите другое размещение, бесплатно пока что не доступно');
            return false;
        }
        hideError(errorAccommodation);
        return true;
    }

    // Валидация поля "Разрешить отзывы"
    function validateReviewsField() {
        const reviewsValue = reviews.checked;
        if (!reviewsValue) {
            showError(errorReviews, 'Вы не согласились с правилами сайта');
            return false;
        }
        hideError(errorReviews);
        return true;
    }

    // Валидация поля "Описание сайта"
    function validateDescriptionField() {
        const descriptionValue = cleanValue(description.value);
        if (!descriptionValue) {
            showError(errorDescription, 'Введите описание сайта');
            return false;
        } else if (descriptionValue.length < 500) {
            showError(errorDescription, 'Описание сайта не может быть меньше 500 символов');
            return false;
        }
        hideError(errorDescription);
        return true;
    }

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

            // Валидация всех полей
            if (!validateDevelopersField()) {
                errors.push({ element: errorDevelopers, message: errorDevelopers.textContent });
                if (!firstErrorField) firstErrorField = developers;
            }
            if (!validateSiteNameField()) {
                errors.push({ element: errorSiteName, message: errorSiteName.textContent });
                if (!firstErrorField) firstErrorField = siteName;
            }
            if (!validateLaunchDateField()) {
                errors.push({ element: errorLaunchDate, message: errorLaunchDate.textContent });
                if (!firstErrorField) firstErrorField = launchDate;
            }
            if (!validateSubField()) {
                errors.push({ element: errorSub, message: errorSub.textContent });
                if (!firstErrorField) firstErrorField = sub;
            }
            if (!validateRubrickField()) {
                errors.push({ element: errorRubrick, message: errorRubrick.textContent });
                if (!firstErrorField) firstErrorField = rubrick;
            }
            if (!validateAccommodationField()) {
                errors.push({ element: errorAccommodation, message: errorAccommodation.textContent });
                if (!firstErrorField) firstErrorField = accommodation[0];
            }
            if (!validateReviewsField()) {
                errors.push({ element: errorReviews, message: errorReviews.textContent });
                if (!firstErrorField) firstErrorField = reviews;
            }
            if (!validateDescriptionField()) {
                errors.push({ element: errorDescription, message: errorDescription.textContent });
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
            form.submit();

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

    // Добавление слушателей событий для валидации при уходе с поля
    developers.addEventListener('blur', validateDevelopersField);
    siteName.addEventListener('blur', validateSiteNameField);
    launchDate.addEventListener('blur', validateLaunchDateField);
    sub.addEventListener('blur', validateSubField);
    rubrick.addEventListener('blur', validateRubrickField);
    Array.from(accommodation).forEach(radio => {
        radio.addEventListener('change', validateAccommodationField);
    });
    reviews.addEventListener('blur', validateReviewsField);
    description.addEventListener('blur', validateDescriptionField);

    // Добавление слушателя события на отправку формы
    form.addEventListener('submit', validateInfoForm, false);
});