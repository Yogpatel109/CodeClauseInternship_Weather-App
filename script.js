const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherDisplay = document.getElementById('weather-display');
const errorMessage = document.getElementById('error-message');

// Today's Weather elements
const todayWeatherCard = document.querySelector('.today-weather-card');
const cityNameToday = document.querySelector('.city-name-today');
const todayIcon = document.querySelector('.today-icon');
const todayDescription = document.querySelector('.today-description');
const todayTemp = document.querySelector('.today-temp');
const todayFeelsLike = document.querySelector('.today-feels-like');
const todayHumidity = document.getElementById('today-humidity');
const todayWind = document.getElementById('today-wind');
const todayPressure = document.getElementById('today-pressure');

// Forecast section elements
const forecastSection = document.querySelector('.forecast-section');
const forecastCardsContainer = document.getElementById('forecast-cards-container');
const initialMessage = document.querySelector('.initial-message');

const API_KEY = 'bff615209a4e0f7f5ea19d3c4af0a7ab'; // Replace with your actual API key

searchBtn.addEventListener('click', fetchWeatherData);
cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        fetchWeatherData();
    }
});

async function fetchWeatherData() {
    const city = cityInput.value.trim();

    if (!city) {
        displayError('Please enter a city name.');
        return;
    }

    // Clear previous displays and show loading state
    clearWeatherData();
    errorMessage.innerHTML = '';
    initialMessage.textContent = 'Fetching data...';
    initialMessage.classList.remove('hidden');

    try {
        // Fetch current weather data first (for "Today's Weather" card)
        const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        if (!currentResponse.ok) {
            if (currentResponse.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            } else if (currentResponse.status === 401) {
                throw new Error('Unauthorized: Invalid API key. Please check your API key in script.js and ensure it\'s active.');
            } else {
                throw new Error(`Error fetching current weather: ${currentResponse.statusText || currentResponse.status}`);
            }
        }
        const currentData = await currentResponse.json();
        displayCurrentWeather(currentData);

        // Fetch 5-day / 3-hour forecast data
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        if (!forecastResponse.ok) {
            // Error handling for forecast API is similar
            throw new Error(`Error fetching forecast: ${forecastResponse.statusText || forecastResponse.status}`);
        }
        const forecastData = await forecastResponse.json();
        displayForecast(forecastData);

    } catch (error) {
        displayError(error.message);
    } finally {
        initialMessage.classList.add('hidden'); // Hide loading/initial message
    }
}

function clearWeatherData() {
    todayWeatherCard.classList.add('hidden');
    forecastSection.classList.add('hidden');
    forecastCardsContainer.innerHTML = '';
    errorMessage.innerHTML = '';
    initialMessage.classList.add('hidden'); // Initially hide, will be shown as "Fetching data..."
}

function displayCurrentWeather(data) {
    cityNameToday.textContent = `${data.name}, ${data.sys.country}`;
    todayIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    todayDescription.textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    todayTemp.textContent = `${Math.round(data.main.temp)}°C`;
    todayFeelsLike.textContent = `Feels like: ${Math.round(data.main.feels_like)}°C`;
    todayHumidity.textContent = `${data.main.humidity}%`;
    todayWind.textContent = `${data.wind.speed} m/s`;
    todayPressure.textContent = `${data.main.pressure} hPa`;

    todayWeatherCard.classList.remove('hidden');
    cityInput.value = ''; // Clear input after successful search
}

function displayForecast(data) {
    forecastCardsContainer.innerHTML = ''; // Clear previous forecast cards
    const dailyForecasts = processForecastData(data.list);

    // Display forecasts for the next 4 days (excluding today)
    for (let i = 1; i < Math.min(dailyForecasts.length, 5); i++) { // Max 4 days after today
        const day = dailyForecasts[i];
        const forecastCard = document.createElement('div');
        forecastCard.classList.add('forecast-card');

        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const description = day.description.charAt(0).toUpperCase() + day.description.slice(1);

        forecastCard.innerHTML = `
            <p class="date">${dayName}, ${monthDay}</p>
            <img class="forecast-icon" src="http://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${description}">
            <p class="description">${description}</p>
            <p class="temps">${Math.round(day.temp_avg)}°C</p>
            <p class="min-max">Min: ${Math.round(day.temp_min)}°C / Max: ${Math.round(day.temp_max)}°C</p>
        `;
        forecastCardsContainer.appendChild(forecastCard);
    }
    forecastSection.classList.remove('hidden');
}

function processForecastData(list) {
    const dailyData = {};

    list.forEach(item => {
        const date = new Date(item.dt * 1000); // Convert Unix timestamp to milliseconds
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
                temps: [],
                descriptions: {},
                icons: {},
                date: date
            };
        }
        dailyData[dayKey].temps.push(item.main.temp);
        dailyData[dayKey].descriptions[item.weather[0].description] = (dailyData[dayKey].descriptions[item.weather[0].description] || 0) + 1;
        dailyData[dayKey].icons[item.weather[0].icon] = (dailyData[dayKey].icons[item.weather[0].icon] || 0) + 1;
    });

    const result = [];
    for (const dayKey in dailyData) {
        const day = dailyData[dayKey];
        const temps = day.temps;

        // Calculate average, min, max temp for the day
        const temp_min = Math.min(...temps);
        const temp_max = Math.max(...temps);
        const temp_avg = temps.reduce((sum, t) => sum + t, 0) / temps.length;

        // Find most frequent description and icon for the day
        const description = Object.keys(day.descriptions).reduce((a, b) => day.descriptions[a] > day.descriptions[b] ? a : b);
        const icon = Object.keys(day.icons).reduce((a, b) => day.icons[a] > day.icons[b] ? a : b);

        result.push({
            date: day.date,
            temp_min: temp_min,
            temp_max: temp_max,
            temp_avg: temp_avg,
            description: description,
            icon: icon
        });
    }

    // Sort by date to ensure correct order
    result.sort((a, b) => a.date - b.date);
    return result;
}


function displayError(message) {
    clearWeatherData(); // Clear any existing weather info
    initialMessage.classList.add('hidden'); // Hide initial/loading message
    errorMessage.innerHTML = `<p>${message}</p>`;
    // Show the initial message again if no city was entered
    if (message.includes('Please enter a city name.')) {
        initialMessage.textContent = 'Enter a city to get the 5-day forecast.';
        initialMessage.classList.remove('hidden');
    }
}