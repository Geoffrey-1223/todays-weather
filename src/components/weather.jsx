import React, { useEffect, useState, useRef } from 'react'
import'./weather.css'
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import rain_icon from '../assets/rain.png';
import snow_icon from '../assets/snow.png';
const Weather = () => {

    const inputRefCity = useRef();
    const [weatherData, setWeatherData] = useState(false);
    const [notification, setNotification] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedCountryCode, setSelectedCountryCode] = useState("");
    // const [isToggled, setIsToggled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    // console.log("isMobile====>", isMobile)
    const allIcons = {
        "01d": clear_icon,
        "01n": clear_icon,
        "02d": cloud_icon,
        "02n": cloud_icon,
        "03d": cloud_icon,
        "03n": cloud_icon,
        "04d": drizzle_icon,
        "04n": drizzle_icon,
        "09d": rain_icon,
        "09n": rain_icon,
        "10d": rain_icon,
        "10n": rain_icon,
        "13d": snow_icon,
        "13n": snow_icon,

    }

    const saveToHistory = (values) => {
        // Function to format date and time
        const formatDateTime = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            const year = date.getFullYear();
            
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const period = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12;
    
            return `${day}-${month}-${year} ${hours}:${minutes}${period}`; // Final format
        };
    
        const currentTime = formatDateTime(new Date()); // Get the formatted current time
        const existingHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
        const searchRecord = { city: values.city, time: currentTime, code: values.code, country: values.country}; // Use formatted time
        const isCityInHistory = existingHistory.some(record => {
            if (record.city === "") {
                return record.country === values.country;
            }
            return record.city === values.city;
        });      
        if (!isCityInHistory) {
            existingHistory.push(searchRecord);
        }
        
        localStorage.setItem("searchHistory", JSON.stringify(existingHistory));
    };

    const removeFromHistory = (values) => {
        const existingHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
        const updatedHistory = existingHistory.filter(record => {
            if (record.city === "") {
                return record.country !== values;
            }
            return record.city !== values;
        }); 
        localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    
        setNotification(`Removed ${values} from search history.`);
        setShowNotification(true);
    
        setTimeout(() => {
            setShowNotification(false);
            setTimeout(() => setNotification(''), 500); 
        }, 3000);
    };

    const searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    const apiCalling = async (value) => {
        if (value === "" && selectedCountry === "") {
            alert("Please enter a valid city or country name");
            return;
        }
        try {
            let url = '';
            if (value.city !== "") {
                // If a city is provided
                url = `https://api.openweathermap.org/data/2.5/weather?q=${value.city},${value.code}&appid=c4018a9c19a8a43468b664b58b29e976&units=metric`;
            } else {
                // If only the country is selected
                url = `https://api.openweathermap.org/data/2.5/weather?q=${value.country}&appid=c4018a9c19a8a43468b664b58b29e976&units=metric`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if(data.message === "city not found") {
                setNotification(`Please Enter a valid City Name`);
                setShowNotification(true);
                setTimeout(() => {
                    setShowNotification(false);
                    setTimeout(() => setNotification(''), 500); 
                }, 3000);
            } else {
                const icon = allIcons[data.weather[0].icon] || clear_icon;
        
                const date = new Date(data.dt * 1000); // Convert seconds to milliseconds
                
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                const year = date.getFullYear();
        
                let hours = date.getHours();
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const period = hours >= 12 ? 'pm' : 'am'; // Determine AM/PM
                hours = hours % 12 || 12; // Convert to 12-hour format
                
                const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}${period}`;
                setWeatherData({
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed,
                    temperature: Math.floor(data.main.temp),
                    minTemp: Math.floor(data.main.temp_min),
                    maxTemp: Math.floor(data.main.temp_max),
                    time: formattedDateTime, // Use the formatted date and time
                    location: data.name,
                    countryCode: value.code,
                    icon: icon,
                    mainWeather: data.weather[0].main
                });
        
                saveToHistory({city: value.city, code:  value.code, country: value.country});
            }
        } catch (error) {
            console.error("Error fetching weather data:", error); // Log any errors
        }
    };

    useEffect(() => {
        const getCityFromIP = async () => {
            try {
                const response = await fetch('http://ip-api.com/json/');
                const data = await response.json();
                if (data.status === 'success') {
                    const cityName = data.city; 
                    apiCalling({city: cityName, code: data.countryCode, country: data.country}); 
                } else {
                    // Fallback to a default city if IP geolocation fails
                    apiCalling("London");
                }

                const countryResponse = await fetch('https://restcountries.com/v3.1/all');
                const countryApiData = await countryResponse.json();
                // Extract country names and codes
                const countryList = countryApiData.map(country => ({
                    name: country.name.common, // Common name
                    code: country.cca2,         // 2-letter country code
                }));
                setCountries(countryList);
            } catch (error) {
                console.error("Error fetching IP geolocation: ", error);
                // Fallback to a default city on error
                apiCalling("London");
            }
        };

        getCityFromIP();


        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 700px)").matches);
          };
      
          // Check on initial render
          checkMobile();
      
          // Add listener to handle window resize
          window.addEventListener("resize", checkMobile);
      
          // Clean up listener on unmount
          return () => window.removeEventListener("resize", checkMobile);
    });

    // const handleToggle = () => {
    //     setIsToggled(!isToggled);
    //     console.log("toggle!!!")
    //     // Optionally, you can trigger theme change here
    //     // document.body.classList.toggle('dark-theme', !isToggled);
    //   };
  return (
    <div className='weather-container'>
        {/* <div className="theme-switch">
            <label className="switch">
                <input type="checkbox" checked={isToggled} onChange={handleToggle} />
                <span className="slider round"></span>
            </label>
        </div> */}
        <div className='weather'>
            <div className='search-bar'>
                <select 
                    value={selectedCountry && selectedCountry.name} 
                    onChange={(e) => {
                        const country = countries.find(c => c.code === e.target.value); // Find the selected country
                        setSelectedCountryCode( country.code); // Set both name and code
                        setSelectedCountry( country.name); // Set both name and code
                    }} 
                    className='country-dropdown'
                >
                    <option value="" disabled>Select Country</option>
                    {countries.map(country => (
                        <option key={country.code} value={country.code}>
                            {country.name}
                        </option>
                    ))}
                </select>
                {/* <input ref={inputRefCountry} type="text" placeholder='Search Country' /> */}
                <input ref={inputRefCity} type="text" placeholder='Search City' />
                <SearchIcon className='search-icon' onClick={() => apiCalling({city: inputRefCity.current.value || "", code: selectedCountryCode, country: selectedCountry})} />
            </div>
        </div>
    
        <div className='weather-section'>
            <img src={weatherData.icon} alt="cloud"  className="sun-image"/>
            {!isMobile ? (
                <>
                <div className='d-flex flex-column'>
                    <div className='bd-highlight'>Today's Weather</div>
                    <div className='temperature'>{weatherData.temperature} <span className="temperature-unit">°C</span></div>
                </div>
                <div className='d-flex flex-row gap-3 weather-detail'>
                    <div className='bd-highlight'>H: </div>
                    <div className='bd-highlight'>{weatherData.maxTemp} <span className="high-temperature">°C</span></div>
    
                    <div className='bd-highlight ml-3'>L: </div>
                    <div className='bd-highlight'>{weatherData.minTemp} <span className="high-temperature">°C</span></div>
                </div>
                <div className="d-flex flex-row justify-content-between weather-detail">
                    <div class="bd-highlight">{weatherData.location}, {weatherData.countryCode || selectedCountryCode}</div>
                    <div class="bd-highlight">{weatherData.time}</div>
                    <div class="bd-highlight">Humidity: {weatherData.humidity}%</div>
                    <div class="bd-highlight">{weatherData.mainWeather}</div>
                </div>

                <div className='history-section'>
                <div>Search History</div>
                    {notification && (
                        <div className={`notification ${showNotification ? 'show' : ''}`}>
                            {notification}
                        </div>
                    )}

                    {searchHistory.length > 0 && searchHistory.map(weatherHistory => (
                        <div className='d-flex flex-column'>
                            <div className='d-flex flex-row p-2 justify-content-between history-record'>
                                <div className='history-location'>
                                    {weatherHistory.city || weatherHistory.country},{weatherHistory.code || selectedCountryCode}
                                </div>
                                <div className='d-flex flex-row justify-content-between history-location'>
                                    <span>{weatherHistory.time}</span>
                                    <SearchIcon className='history-icon' onClick={() => { setSelectedCountryCode(weatherHistory.code); apiCalling({city: weatherHistory.city, code: weatherHistory.code, country: weatherHistory.country})}}/>
                                    <DeleteIcon 
                                        className='history-icon'
                                        onClick={() => removeFromHistory(weatherHistory.city !== "" ? weatherHistory.city : weatherHistory.country)} 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>  
                
                </>
            ) : (
                <>
                    <div className='d-flex flex-row justify-content-between p-3'>
                        <div className='d-flex flex-column weather-mobile-temperature'>
                            <div className='bd-highlight'>Today's Weather</div>
                            <div className='temperature'>{weatherData.temperature} <span className="temperature-unit">°C</span></div>
                            <div className='d-flex flex-row gap-3 weather-detail'>
                                <div className='bd-highlight'>H: </div>
                                <div className='bd-highlight'>{weatherData.maxTemp} <span className="high-temperature">°C</span></div>
                
                                <div className='bd-highlight ml-3'>L: </div>
                                <div className='bd-highlight'>{weatherData.minTemp} <span className="high-temperature">°C</span></div>
                            </div>
                            <div class="bd-highlight">{weatherData.location}, {weatherData.countryCode || selectedCountryCode}</div>
                        </div>
                        <div className='d-flex flex-column weather-mobile-detail'>
                            <div class="bd-highlight ">{weatherData.mainWeather}</div>
                            <div class="bd-highlight">Humidity: {weatherData.humidity}%</div>
                            <div class="bd-highlight">{weatherData.time}</div>
                        </div>
                    </div>

                    <div className='history-section'>
                        <div>Search History</div>
                        {notification && (
                            <div className={`notification ${showNotification ? 'show' : ''}`}>
                                {notification}
                            </div>
                        )}

                        {searchHistory.length > 0 && searchHistory.map(weatherHistory => (
                            <div className='d-flex flex-row justify-content-between history-record'>
                                <div className='d-flex flex-column p-2  '>
                                    <div className='history-location'>
                                        {weatherHistory.city || weatherHistory.country},  {weatherHistory.code || selectedCountryCode}
                                    </div>
                                    <div className='d-flex flex-row justify-content-between history-time'>
                                        <span>{weatherHistory.time}</span>
                                    
                                    </div>
                                </div >

                                <div className='d-flex flex-row justify-content-between history-record-icon'>
                                    <SearchIcon className='history-icon' onClick={() => { setSelectedCountryCode(weatherHistory.code); apiCalling({city: weatherHistory.city, code: weatherHistory.code, country: weatherHistory.country})}}/>
                                    <DeleteIcon 
                                        className='history-icon'
                                        onClick={() => removeFromHistory(weatherHistory.city !== "" ? weatherHistory.city : weatherHistory.country)} 
                                    />
                                </div>
                                
                            </div>
                        ))}
                    </div>  
                </>
                 )}

            {/* <div className='history-section'>
                <div>Search History</div>
                {notification && (
                    <div className={`notification ${showNotification ? 'show' : ''}`}>
                        {notification}
                    </div>
                )}

                {searchHistory.length > 0 && searchHistory.map(weatherHistory => (
                    <div className='d-flex flex-column'>
                        <div className='d-flex flex-row p-2 justify-content-between history-record'>
                            <div className='history-location'>
                                {weatherHistory.city || weatherHistory.country},{weatherHistory.code || selectedCountryCode}
                            </div>
                            <div className='d-flex flex-row justify-content-between history-location'>
                                <span>{weatherHistory.time}</span>
                                <SearchIcon className='history-icon' onClick={() => { setSelectedCountryCode(weatherHistory.code); apiCalling({city: weatherHistory.city, code: weatherHistory.code, country: weatherHistory.country})}}/>
                                <DeleteIcon 
                                    className='history-icon'
                                    onClick={() => removeFromHistory(weatherHistory.city !== "" ? weatherHistory.city : weatherHistory.country)} 
                                 />
                            </div>
                        </div>
                    </div>
                ))}
        </div>   */}
        </div>


    </div>
  )
}

export default Weather