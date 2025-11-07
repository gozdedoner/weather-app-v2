import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import Lottie from "lottie-react";
import "./index.css";

import WeatherBackground from "./components/WeatherBackground";
import AmbientSound from "./components/AmbientSound";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const API_KEY = import.meta.env.VITE_API_KEY;

interface WeatherData {
  name: string;
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  weather: { main: string; description: string; icon: string }[];
}

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isDay, setIsDay] = useState(true);
  const [animationData, setAnimationData] = useState<any>(null);
  const [time, setTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState("today");

  // 🕓 Saat & tarih formatı
  const updateTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    };
    setTime(now.toLocaleTimeString("en-GB", options));
  };

  // 🌤️ Animasyon dosyası (public klasöründen)
  const getAnimation = async (main: string) => {
    switch (main?.toLowerCase()) {
      case "clear":
        return "/animations/clear.json";
      case "rain":
        return "/animations/rain.json";
      case "clouds":
        return "/animations/clouds.json";
      case "snow":
        return "/animations/snow.json";
      case "thunderstorm":
        return "/animations/thunder.json";
      default:
        return "/animations/clear.json";
    }
  };

  // 🎨 Arka plan renk geçişleri
  const getBackground = (main: string) => {
    if (isDay) {
      switch (main?.toLowerCase()) {
        case "clear":
          return "from-sky-400 to-yellow-300";
        case "rain":
          return "from-blue-500 to-indigo-600";
        case "clouds":
          return "from-gray-300 to-blue-400";
        case "snow":
          return "from-blue-200 to-cyan-300";
        default:
          return "from-pink-400 to-purple-500";
      }
    } else {
      switch (main?.toLowerCase()) {
        case "clear":
          return "from-gray-900 to-indigo-800";
        case "rain":
          return "from-indigo-900 to-blue-900";
        case "clouds":
          return "from-gray-800 to-gray-900";
        case "snow":
          return "from-slate-600 to-blue-800";
        default:
          return "from-purple-900 to-black";
      }
    }
  };

  // 🌦️ Şehirden hava durumu çek
  const fetchWeather = async (cityName: string) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      if (!res.ok) {
        setWeather(null);
        setError("City not found ❌");
        return;
      }
      const data = await res.json();
      setWeather(data);
      setError("");
      fetchForecast(cityName);
    } catch {
      setError("An error occurred ⚠️");
    }
  };

  // 📊 5 Günlük Tahmin
  const fetchForecast = async (cityName: string) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      const dailyData = data.list.filter((_: any, i: number) => i % 8 === 0);
      setForecast(dailyData);
    } catch {
      console.error("Forecast fetch failed");
    }
  };

  // 📍 Konumdan otomatik hava durumu
  const fetchWeatherByLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          );
          const data = await res.json();
          setWeather(data);
          setCity(data.name);
          fetchForecast(data.name);
        },
        () => setError("Location access denied ❌")
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") fetchWeather(city);
  };

  // 🌇 Gündüz/Gece kontrolü + saat
  useEffect(() => {
    const hour = new Date().getHours();
    setIsDay(hour >= 6 && hour < 18);
    fetchWeatherByLocation();
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 🎬 Lottie JSON yükleme (public klasöründen)
  useEffect(() => {
    const loadAnimation = async () => {
      if (weather?.weather?.[0]?.main) {
        const url = await getAnimation(weather.weather[0].main);
        const response = await fetch(url);
        const json = await response.json();
        setAnimationData(json);
      }
    };
    loadAnimation();
  }, [weather]);

  const bgClass = getBackground(weather?.weather?.[0]?.main || "");

  // 📈 Grafik verisi
  const chartData = {
    labels: forecast.map((item) =>
      new Date(item.dt_txt).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Daily Avg Temp (°C)",
        data: forecast.map((item) => item.main.temp),
        borderColor: "rgba(255,255,255,0.8)",
        backgroundColor: "rgba(255,255,255,0.3)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: "white" } } },
    scales: {
      x: {
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.2)" },
      },
      y: {
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.2)" },
      },
    },
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${bgClass} bg-animated text-white p-4 transition-[background] duration-[3000ms] ease-in-out relative overflow-hidden`}
    >
      {/* 🌈 Lottie Arkaplan */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-40">
        {animationData && <Lottie animationData={animationData} loop />}
      </div>

      {/* 🌌 Partikül efekti */}
      <WeatherBackground
        type={weather?.weather?.[0]?.main?.toLowerCase() || "clear"}
      />

      {/* 🎧 Arka plan sesi */}
      <AmbientSound
        weatherType={weather?.weather?.[0]?.main?.toLowerCase() || "clear"}
      />

      {/* 🌤️ Ana Kart */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-80 sm:w-[28rem] text-center border border-white/20 transition-all duration-300 z-10">
        <h1 className="text-2xl font-bold mb-4 flex justify-center items-center gap-2">
          {isDay ? "☀️" : "🌙"} Weather App
        </h1>
        <p className="text-sm text-pink-200 mb-4">{time}</p>

        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a city..."
          className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-pink-200 outline-none border border-white/30 text-center"
        />

        {error && <p className="text-pink-200 mt-3">{error}</p>}

        {/* 🔘 Sekmeler */}
        <div className="flex justify-center gap-4 mt-6">
          {["today", "tomorrow", "5days"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-pink-500 text-white"
                  : "bg-white/10 text-pink-200 hover:bg-white/20"
              }`}
            >
              {tab === "today"
                ? "Today"
                : tab === "tomorrow"
                ? "Tomorrow"
                : "5 Days"}
            </button>
          ))}
        </div>

        {/* 🌤️ Sekme içerikleri */}
        {activeTab === "today" && weather && (
          <div className="mt-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold">{weather.name}</h2>
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
              className="w-20 h-20 mt-2 drop-shadow-lg"
            />
            <p className="text-5xl font-bold">
              {Math.round(weather.main.temp)}°C
            </p>
            <p className="text-lg text-pink-200 capitalize">
              {weather.weather[0].description}
            </p>
            <div className="mt-4 space-y-1 text-sm text-pink-100">
              <p>Feels like: {Math.round(weather.main.feels_like)}°C</p>
              <p>Humidity: {weather.main.humidity}% 💧</p>
              <p>Wind: {Math.round(weather.wind.speed)} m/s 🌬️</p>
            </div>
          </div>
        )}

        {activeTab === "tomorrow" && forecast.length > 1 && (
          <div className="mt-6 text-pink-100">
            <h2 className="text-xl font-semibold mb-3">
              Tomorrow in {weather?.name}
            </h2>
            <p className="text-5xl font-bold">
              {Math.round(forecast[1].main.temp)}°C
            </p>
            <p className="capitalize text-pink-200 mb-2">
              {forecast[1].weather[0].description}
            </p>
            <p>Feels like: {Math.round(forecast[1].main.feels_like)}°C</p>
            <p>Humidity: {forecast[1].main.humidity}% 💧</p>
            <p>Wind: {Math.round(forecast[1].wind.speed)} m/s 🌬️</p>
          </div>
        )}

        {activeTab === "5days" && forecast.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg mb-2 text-pink-200">5-Day Forecast</h3>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      <footer className="mt-6 text-sm text-pink-200 z-10">
        Built with 💖 by Gözde
      </footer>
    </div>
  );
}
