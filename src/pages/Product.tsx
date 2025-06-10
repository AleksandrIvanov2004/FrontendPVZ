import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { getAllProducts, addProduct } from '../service/productService';
import { getAllPickUpPoints } from '../service/pickUpPointService';
import '../styles/ProductsPage.css';
import { productType } from '../types/productType';
import { pickUpPointType } from '../types/pickUpPoint';

type StatusEnum__2 = 'NOT_SENT' | 'SENT_IN_PVZ' | 'DELIVERED_IN_PVZ' | 'RECEIVED';

const ProductsPage = () => {
  const navigate = useNavigate();
  const userToken = useSelector(selectAuthToken);
  
  const [allProducts, setAllProducts] = useState<productType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<productType[]>([]);
  const [pickUpPoints, setPickUpPoints] = useState<pickUpPointType[]>([]);
  const [newProduct, setNewProduct] = useState<Omit<productType, 'id'>>({
    articul: '',
    discr: '',
    pick_up_point_id: 0,
    supply_id: null,
    status: 'NOT_SENT'
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState({
    products: false,
    pickUpPoints: false,
    addProduct: false
  });
  const [selectedProduct, setSelectedProduct] = useState<productType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Проверка авторизации и загрузка данных
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(prev => ({...prev, products: true, pickUpPoints: true}));
        
        // Загружаем товары
        const productsResponse = await getAllProducts();
        setAllProducts(productsResponse.data);
        setFilteredProducts(productsResponse.data);
        
        // Загружаем пункты выдачи
        const pointsResponse = await getAllPickUpPoints();
        setPickUpPoints(pointsResponse.data);
        
      } catch (error) {
        setError('Ошибка загрузки данных');
      } finally {
        setIsLoading(prev => ({...prev, products: false, pickUpPoints: false}));
      }
    };

    fetchData();
  }, [navigate, userToken]);

  // Фильтрация товаров при изменении поискового запроса
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product =>
        product.articul.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, allProducts]);

  const handleAddProduct = async () => {
    if (!newProduct.articul || !newProduct.discr) {
      setError('Заполните обязательные поля');
      return;
    }

    try {
      setIsLoading(prev => ({...prev, addProduct: true}));
      
      const productToAdd = {
        ...newProduct,
        id: 0, // временный ID, будет заменен сервером
        supply_id: newProduct.supply_id || null,
        pick_up_point_id: newProduct.pick_up_point_id
      };

      const createdProduct = await addProduct(productToAdd, userToken);
      
      setAllProducts([...allProducts, createdProduct]);
      setFilteredProducts([...allProducts, createdProduct]);
      setSuccessMessage(`Товар успешно добавлен`);
      setNewProduct({
        articul: '',
        discr: '',
        pick_up_point_id: 0,
        supply_id: null,
        status: 'NOT_SENT'
      });
      setSearchTerm('');
    } catch (error) {
      setError('Ошибка при добавлении товара');
    } finally {
      setIsLoading(prev => ({...prev, addProduct: false}));
    }
  };

  const getStatusColor = (status: StatusEnum__2) => {
    switch(status) {
      case 'NOT_SENT': return 'var(--status-not-sent)';
      case 'SENT_IN_PVZ': return 'var(--status-sent)';
      case 'DELIVERED_IN_PVZ': return 'var(--status-delivered)';
      case 'RECEIVED': return 'var(--status-received)';
      default: return 'var(--status-default)';
    }
  };

  const getStatusLabel = (status: StatusEnum__2) => {
    switch(status) {
      case 'NOT_SENT': return 'Не отправлен';
      case 'SENT_IN_PVZ': return 'Отправлен в ПВЗ';
      case 'DELIVERED_IN_PVZ': return 'Доставлен в ПВЗ';
      case 'RECEIVED': return 'Получен';
      default: return status;
    }
  };

  const getPickUpPointAddress = (id: number | null) => {
    if (!id) return 'Не указан';
    const point = pickUpPoints.find(p => p.id === id);
    return point ? `${point.address} (Регион ${point.region})` : 'Неизвестный ПВЗ';
  };

  return (
    <div className="products-page-container">
      {/* Уведомления */}
      {error && (
        <div className="notification error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {successMessage && (
        <div className="notification success">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      <div className="products-content">
        <h1>Управление товарами</h1>
        
        <div className="products-layout">
          {/* Форма добавления товара */}
          <div className="product-form-section">
            <h2>Добавить новый товар</h2>
            
            <div className="product-form">
              <div className="form-group">
                <label>Артикул:</label>
                <input
                  type="text"
                  value={newProduct.articul}
                  onChange={(e) => setNewProduct({...newProduct, articul: e.target.value})}
                  placeholder="Введите артикул"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Описание:</label>
                <textarea
                  value={newProduct.discr}
                  onChange={(e) => setNewProduct({...newProduct, discr: e.target.value})}
                  placeholder="Введите описание товара"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Пункт выдачи:</label>
                <select
                  value={newProduct.pick_up_point_id || ''}
                  onChange={(e) => setNewProduct({
                    ...newProduct, 
                    pick_up_point_id: Number(e.target.value)
                  })}
                  disabled={isLoading.pickUpPoints}
                >
                  <option value="">Выберите пункт выдачи</option>
                  {pickUpPoints.map(point => (
                    <option key={point.id} value={point.id}>
                      {point.address} (Регион {point.region})
                    </option>
                  ))}
                </select>
                {isLoading.pickUpPoints && <div className="loading-small">Загрузка...</div>}
              </div>
              
              <div className="form-group">
                <label>Статус:</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({
                    ...newProduct, 
                    status: e.target.value as StatusEnum__2
                  })}
                >
                  <option value="NOT_SENT">Не отправлен</option>
                </select>
              </div>
              
              <button 
                className="add-button"
                onClick={handleAddProduct}
                disabled={isLoading.addProduct || !newProduct.articul || !newProduct.discr}
              >
                {isLoading.addProduct ? 'Добавление...' : 'Добавить товар'}
              </button>
            </div>
          </div>

          {/* Список товаров с поиском */}
          <div className="products-list-section">
            <div className="search-container">
              <h2>Список товаров ({filteredProducts.length})</h2>
              <div className="search-box">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск по артикулу"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {isLoading.products ? (
              <div className="loading">Загрузка товаров...</div>
            ) : filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="product-header">
                      <span 
                        className="product-status"
                        style={{ backgroundColor: getStatusColor(product.status) }}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </div>
                    <h3 className="product-articul">Артикул: {product.articul}</h3>
                    <p className="product-description">{product.discr}</p>
                    {product.pick_up_point_id && (
                      <p className="product-pvz">ПВЗ: {getPickUpPointAddress(product.pick_up_point_id)}</p>
                    )}
                    {product.supply_id && (
                      <p className="product-supply">Поставка: #{product.supply_id}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="no-results">
                <p>Товары с артикулом "{searchTerm}" не найдены</p>
                <button 
                  className="reset-search"
                  onClick={() => setSearchTerm('')}
                >
                  Показать все товары
                </button>
              </div>
            ) : (
              <p className="no-products">Нет товаров для отображения</p>
            )}
          </div>

          {/* Детальная информация о товаре */}
          {selectedProduct && (
            <div className="product-details-section">
              <h2>Детали товара</h2>
              <div className="product-details">
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">#{selectedProduct.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Артикул:</span>
                  <span className="detail-value">{selectedProduct.articul}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Описание:</span>
                  <span className="detail-value">{selectedProduct.discr}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span 
                    className="detail-value status-badge"
                    style={{ backgroundColor: getStatusColor(selectedProduct.status) }}
                  >
                    {getStatusLabel(selectedProduct.status)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Пункт выдачи:</span>
                  <span className="detail-value">
                    {getPickUpPointAddress(selectedProduct.pick_up_point_id)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">ID поставки:</span>
                  <span className="detail-value">
                    {selectedProduct.supply_id || 'Не указан'}
                  </span>
                </div>
              </div>
              <button 
                className="close-details"
                onClick={() => setSelectedProduct(null)}
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;