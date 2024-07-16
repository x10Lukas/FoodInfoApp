import React, { useState } from 'react';
import { Info, Cog } from 'lucide-react';
import './FoodInfoApp.css';

const FoodInfoApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [foodInfo, setFoodInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('food');

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const fetchFoodInfo = async (query) => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (/^\d+$/.test(query)) {
        url = `https://world.openfoodfacts.org/api/v0/product/${query}.json`;
      } else {
        url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.product) {
        setFoodInfo(processProductData(data.product));
      } else if (data.products && data.products.length > 0) {
        setFoodInfo(processProductData(data.products[0]));
      } else {
        setError('Keine Informationen für dieses Produkt gefunden.');
      }
    } catch (err) {
      setError(`Fehler beim Abrufen der Daten: ${err.message}`);
    }
    setLoading(false);
  };

  const processProductData = (product) => ({
    name: product.product_name || 'Unbekannter Name',
    calories: product.nutriments['energy-kcal_100g'] || 'N/A',
    protein: product.nutriments.proteins_100g || 'N/A',
    carbs: product.nutriments.carbohydrates_100g || 'N/A',
    fat: product.nutriments.fat_100g || 'N/A',
    ingredients: product.ingredients_text_de ? product.ingredients_text_de.replace(/_/g, '') : 'Keine Zutatenliste verfügbar',
    image: product.image_front_small_url
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchFoodInfo(searchTerm);
    }
  };

  return (
    <div className={`ios-app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="status-bar"></div>
      <header>
        <h1>{activeTab === 'food' ? 'Food Info' : 'Einstellungen'}</h1>
      </header>
      <main>
        <div className="ios-content">
          {activeTab === 'food' && (
            <>
              <div className="search-box">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Lebensmittel oder Barcode eingeben..."
                />
              </div>
              <button className="ios-button" onClick={handleSearch}>
                Suchen
              </button>

              {loading && <p className="description">Laden...</p>}
              {error && <p className="error-message">{error}</p>}

              {foodInfo && (
                <div className="food-info-display">
                  <h2 className="food-name">{foodInfo.name}</h2>
                  {foodInfo.image && (
                    <div className="food-image-container">
                      <img src={foodInfo.image} alt={foodInfo.name} className="food-image" />
                    </div>
                  )}
                  <div className="food-details">
                    <p className="description">Kalorien: {foodInfo.calories} kcal</p>
                    <p className="description">Protein: {foodInfo.protein}g</p>
                    <p className="description">Kohlenhydrate: {foodInfo.carbs}g</p>
                    <p className="description">Fett: {foodInfo.fat}g</p>
                    <h3 className="description">Zutaten:</h3>
                    <p className="description">{foodInfo.ingredients}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <ul className="settings-list">
              <li>
                Dark Mode
                <label className="ios-switch">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                  <span className="slider"></span>
                </label>
              </li>
              {/* Hier können weitere Einstellungsoptionen hinzugefügt werden */}
            </ul>
          )}
        </div>
      </main>

      <nav className="tab-bar">
        <button
          onClick={() => setActiveTab('food')}
          className={activeTab === 'food' ? 'active' : ''}
        >
          <Info size={24} />
          <span>Food Infos</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'active' : ''}
        >
          <Cog size={26} />
          <span>Einstellungen</span>
        </button>
      </nav>
    </div>
  );
};

export default FoodInfoApp;