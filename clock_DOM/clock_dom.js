// Константы для настройки часов
const MIN_DIAMETER = 200; // Минимальный диаметр циферблата в пикселях
const MAX_DIAMETER = 800; // Максимальный диаметр циферблата в пикселях
const NUMBER_COUNT = 12; // Количество цифр на циферблате
const NUMBER_RADIUS_FACTOR = 0.8; // Коэффициент радиуса для размещения цифр
const NUMBER_FONT_SIZE_FACTOR = 0.1; // Коэффициент размера шрифта цифр относительно диаметра
const HOUR_HAND_LENGTH_FACTOR = 0.4; // Коэффициент длины часовой стрелки относительно диаметра
const MINUTE_HAND_LENGTH_FACTOR = 0.6; // Коэффициент длины минутной стрелки относительно диаметра
const SECOND_HAND_LENGTH_FACTOR = 0.85; // Коэффициент длины секундной стрелки относительно диаметра
const HOUR_HAND_WIDTH_FACTOR = 0.025; // Коэффициент ширины часовой стрелки относительно диаметра
const MINUTE_HAND_WIDTH_FACTOR = 0.015; // Коэффициент ширины минутной стрелки относительно диаметра
const SECOND_HAND_WIDTH_FACTOR = 0.005; // Коэффициент ширины секундной стрелки относительно диаметра
const TEXT_FONT_SIZE_FACTOR = 0.12; // Коэффициент размера шрифта текстового отображения времени

document.addEventListener('DOMContentLoaded', () => {
    const inputNum = document.getElementById('inputNum');
    const buttonBuil = document.getElementById('buttonBuil');
    const clockContainer = document.getElementById('clock-container');
    const clockFace = document.getElementById('clock-face');
    const textDisplay = document.getElementById('text-display');
    let animationFrameId = null;

    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function createClock(diameter) {
        clockFace.style.width = `${diameter}px`;
        clockFace.style.height = `${diameter}px`;

        // Удаляем предыдущие элементы
        clockFace.innerHTML = '';
        textDisplay.style.fontSize = `${diameter * TEXT_FONT_SIZE_FACTOR}px`;

        // Создаем цифры 1-12
        const radius = diameter / 2; // Рассчитываем радиус циферблата
        for (let i = 1; i <= NUMBER_COUNT; i++) {
            const angle = (i - 3) * (Math.PI * 2) / NUMBER_COUNT; // Вычисляем угол для каждой цифры, начиная с 12 (смещение на -3 для коррекции)
            const numberElement = document.createElement('div');
            numberElement.className = 'number';
            numberElement.textContent = i.toString();
            numberElement.style.fontSize = `${diameter * NUMBER_FONT_SIZE_FACTOR}px`;
            const x = radius + (radius * NUMBER_RADIUS_FACTOR) * Math.cos(angle); // Координата x для размещения цифры
            const y = radius + (radius * NUMBER_RADIUS_FACTOR) * Math.sin(angle); // Координата y для размещения цифры
            numberElement.style.left = `${x - (diameter * NUMBER_FONT_SIZE_FACTOR) / 2}px`; // Центрируем цифру по x
            numberElement.style.top = `${y - (diameter * NUMBER_FONT_SIZE_FACTOR) / 2}px`; // Центрируем цифру по y
            clockFace.appendChild(numberElement);
        }

        // Создаем стрелки
        const hands = [
            { id: 'hour', lengthFactor: HOUR_HAND_LENGTH_FACTOR, widthFactor: HOUR_HAND_WIDTH_FACTOR },
            { id: 'minute', lengthFactor: MINUTE_HAND_LENGTH_FACTOR, widthFactor: MINUTE_HAND_WIDTH_FACTOR },
            { id: 'second', lengthFactor: SECOND_HAND_LENGTH_FACTOR, widthFactor: SECOND_HAND_WIDTH_FACTOR }
        ];
        hands.forEach(hand => {
            const handElement = document.createElement('div');
            handElement.className = 'hand';
            handElement.id = `${hand.id}-hand`;
            handElement.style.width = `${diameter * hand.widthFactor}px`; // Устанавливаем ширину стрелки
            handElement.style.height = `${diameter * hand.lengthFactor}px`; // Устанавливаем длину стрелки
            handElement.style.left = `${diameter / 2 - (diameter * hand.widthFactor) / 2}px`; // Центрируем стрелку по горизонтали
            handElement.style.bottom = `${diameter / 2}px`; // Устанавливаем основание стрелки в центре циферблата
            clockFace.appendChild(handElement);
        });
    }

    function updateTime() {
        const now = new Date();
        const hours = now.getHours() % 12; // Получаем часы в формате 0-11
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // Обновляем текстовый циферблат
        textDisplay.textContent = formatTime(now);

        // Обновляем положение стрелок
        const hourHand = document.getElementById('hour-hand');
        const minuteHand = document.getElementById('minute-hand');
        const secondHand = document.getElementById('second-hand');

        const hourAngle = (hours % 12) * 30 + minutes * 0.5; // Угол часовой стрелки: 30° на час + 0.5° на минуту
        const minuteAngle = minutes * 6; // Угол минутной стрелки: 6° на минуту
        const secondAngle = seconds * 6; // Угол секундной стрелки: 6° на секунду

        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        secondHand.style.transform = `rotate(${secondAngle}deg)`;

        // Продолжаем анимацию
        animationFrameId = requestAnimationFrame(updateTime);
    }

    function buttonOnClick() {
        const diameter = parseInt(inputNum.value) || MIN_DIAMETER;
        if (diameter < MIN_DIAMETER || diameter > MAX_DIAMETER) {
            alert(`Диаметр часов должен быть от ${MIN_DIAMETER} до ${MAX_DIAMETER} пикселей`);
            return;
        }

        // Очищаем предыдущую анимацию, если она есть
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        clockContainer.style.display = 'block';
        inputNum.style.display = 'none';
        buttonBuil.style.display = 'none';
        createClock(diameter);
        updateTime();
    }

    buttonBuil.addEventListener('click', buttonOnClick);
});