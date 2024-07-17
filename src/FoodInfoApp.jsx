import React, { useState, useEffect } from 'react';
import { Info, Cog, ScanBarcode, X, Search } from 'lucide-react';
import { useZxing } from "react-zxing";
import './FoodInfoApp.css';

const BarcodeScanner = ({ onResult, onClose }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { ref } = useZxing({
    onResult(result) {
      onResult(result.getText());
    },
    onError(error) {
      console.error(error);
      setError("Fehler beim Scannen. Bitte versuchen Sie es erneut.");
    },
  });

  useEffect(() => {
    let mounted = true;
    const currentRef = ref.current;

    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (mounted) {
          if (currentRef) {
            currentRef.srcObject = stream;
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error accessing the camera", err);
        if (mounted) {
          setError("Kamera nicht verfügbar. Bitte überprüfen Sie die Berechtigungen und versuchen Sie es erneut.");
          setIsLoading(false);
        }
      }
    };    

    initializeCamera();

    return () => {
      mounted = false;
      if (currentRef && currentRef.srcObject) {
        currentRef.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [ref]);

  return (
    <div className="barcode-scanner">
      {isLoading ? (
        <div className="scanner-loading">Kamera wird initialisiert...</div>
      ) : error ? (
        <div className="scanner-error">{error}</div>
      ) : (
        <video ref={ref} autoPlay playsInline />
      )}
      <button className="close-scanner" onClick={onClose}>
        <X size={24} />
      </button>
    </div>
  );
};

const FoodInfoApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('food');
  const [searchTerm, setSearchTerm] = useState('');
  const [foodInfo, setFoodInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraPermissionState, setCameraPermissionState] = useState(null);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setError('Bitte geben Sie einen Suchbegriff ein.');
      return;
    }
    fetchFoodInfo(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFoodInfo([]);
    setError('');
  };

  const fetchFoodInfo = async (query) => {
    setLoading(true);
    setError(null);
    console.log(`Fetching food info for: ${query}`);
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

      console.log('API response data:', data);

      if (data.product) {
        setFoodInfo([processProductData(data.product)]);
      } else if (data.products && data.products.length > 0) {
        setFoodInfo(data.products.map(processProductData));
      } else {
        setError('Keine Informationen für dieses Produkt gefunden.');
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Daten:', err);
      setError(`Fehler beim Abrufen der Daten: ${err.message}`);
    }
    setLoading(false);
  };

  const processProductData = (product) => ({
    id: product.id,
    name: product.product_name || 'Unbekannter Name',
    calories: product.nutriments['energy-kcal_100g'] || 'N/A',
    protein: product.nutriments.proteins_100g || 'N/A',
    carbs: product.nutriments.carbohydrates_100g || 'N/A',
    fat: product.nutriments.fat_100g || 'N/A',
    ingredients: product.ingredients_text_de ? product.ingredients_text_de.replace(/_/g, '') : 'Keine Zutatenliste verfügbar',
    image: product.image_front_small_url,
    nutriscore: product.nutriscore_grade || 'N/A',
    nutriscore_image: `https://static.openfoodfacts.org/images/misc/nutriscore-${product.nutriscore_grade}.svg`,
    nova: product.nova_group || 'N/A',
    nova_image: `https://static.openfoodfacts.org/images/attributes/dist/nova-group-${product.nova_group}.svg`,
    ecoscore: product.ecoscore_grade || 'N/A',
    ecoscore_image: `https://static.openfoodfacts.org/images/attributes/dist/ecoscore-${product.ecoscore_grade}.svg`
  });

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      setCameraPermissionState(result.state);
      result.onchange = () => setCameraPermissionState(result.state);
    } catch (error) {
      console.error("Error checking camera permission:", error);
      setCameraPermissionState('prompt');
    }
  };

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const handleBarcodeScan = async () => {
    if (cameraPermissionState === 'granted') {
      setIsScannerOpen(true);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setIsScannerOpen(true);
        checkCameraPermission();
      } catch (err) {
        console.error("Error accessing the camera", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert("Kamera-Zugriff wurde verweigert. Bitte erteilen Sie die Berechtigung in Ihren Browsereinstellungen und laden Sie die Seite neu.");
        } else {
          alert("Es gab ein Problem beim Zugriff auf die Kamera. Bitte stellen Sie sicher, dass Ihre Kamera funktioniert und nicht von einer anderen App verwendet wird.");
        }
      }
    }
  };

  const handleScanResult = (result) => {
    setSearchTerm(result);
    setIsScannerOpen(false);
    fetchFoodInfo(result);
  };

  return (
    <div className={`ios-app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="status-bar"></div>
      <header>
        <h1>{activeTab === 'food' ? 'Food Info App' : 'Einstellungen'}</h1>
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
                  placeholder="Lebensmittel eingeben oder scannen"
                />
                <span className="search-icon">
                  <Search size={22} />
                </span>
                {searchTerm ? (
                  <button onClick={handleClearSearch} className="clear-button">
                    <X size={24} />
                  </button>
                ) : (
                  <button onClick={handleBarcodeScan} className="barcode-scan-button">
                    <ScanBarcode size={24} />
                  </button>
                )}
              </div>
              <button className="ios-button" onClick={handleSearch}>
                Suchen
              </button>

              {isScannerOpen && (
                <BarcodeScanner
                  onResult={handleScanResult}
                  onClose={() => setIsScannerOpen(false)}
                />
              )}

              {loading && <p className="description">Laden...</p>}
              {error && <p className="error-message">{error}</p>}

              {foodInfo.length > 0 && (
                <div className="food-info-display">
                  {foodInfo.map((food) => (
                    <div key={food.id} className="food-item">
                      <h2 className="food-name">{food.name}</h2>
                      {food.image && (
                        <div className="food-image-container">
                          <img src={food.image} alt={food.name} className="food-image" />
                        </div>
                      )}
                      <div className="food-details">
                        <p className="description">Kalorien: {food.calories} kcal</p>
                        <p className="description">Protein: {food.protein}g</p>
                        <p className="description">Kohlenhydrate: {food.carbs}g</p>
                        <p className="description">Fett: {food.fat}g</p>
                        <h3 className="description">Zutaten:</h3>
                        <p className="description">{food.ingredients}</p>
                        <div className="score-container">
                          {food.nutriscore !== 'N/A' && (
                            <img src={food.nutriscore_image} alt={`Nutri-Score ${food.nutriscore}`} className="score-image" />
                          )}
                          {food.nova !== 'N/A' && (
                            <img src={food.nova_image} alt={`NOVA ${food.nova}`} className="nova-image" />
                          )}
                          {food.ecoscore !== 'N/A' && (
                            <img src={food.ecoscore_image} alt={`Eco-Score ${food.ecoscore}`} className="score-image" />
                          )}
                        </div>
                        <hr></hr>
                      </div>
                    </div>
                  ))}
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
