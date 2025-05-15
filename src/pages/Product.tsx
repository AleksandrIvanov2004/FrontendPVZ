import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectAuthToken } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { getAllProducts, addProduct } from '../service/productService';
import '../styles/ProductsPage.css';

type StatusEnum__1 = 'NOT_SENT' | 'DELIVERED_IN_PVZ' | 'RECEIVED';

interface ProductType {
  id: number;
  articul: string;
  discr: string;
  supply_id: number | null;
  status: StatusEnum__1;
}

const ProductsPage = () => {
  const navigate = useNavigate();
  const userToken = useSelector(selectAuthToken);
  
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [newProduct, setNewProduct] = useState<Omit<ProductType, 'id'>>({
    articul: '',
    discr: '',
    supply_id: null,
    status: 'NOT_SENT'
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState({
    products: false,
    addProduct: false
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Проверка авторизации и загрузка товаров
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProducts = async () => {
      try {
        setIsLoading(prev => ({...prev, products: true}));
        const { data } = await getAllProducts();
        setAllProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        setError('Ошибка загрузки товаров');
      } finally {
        setIsLoading(prev => ({...prev, products: false}));
      }
    };

    fetchProducts();
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
        id: 0,
        ...newProduct,
        supply_id: newProduct.supply_id || 0
      };

      const createdProduct  = await addProduct(productToAdd, userToken);
      
      setAllProducts([...allProducts, createdProduct]);
      setFilteredProducts([...allProducts, createdProduct]);
      setSuccessMessage(`Товар "${createdProduct.articul}" успешно добавлен`);
      setNewProduct({
        articul: '',
        discr: '',
        supply_id: null,
        status: 'NOT_SENT'
      });
      setSearchTerm(''); // Сбрасываем поиск после добавления
    } catch (error) {
      setError('Ошибка при добавлении товара');
    } finally {
      setIsLoading(prev => ({...prev, addProduct: false}));
    }
  };
   

  const getStatusColor = (status: StatusEnum__1) => {
    switch(status) {
      case 'NOT_SENT': return 'var(--status-not-sent)';
      case 'DELIVERED_IN_PVZ': return 'var(--status-delivered)';
      case 'RECEIVED': return 'var(--status-received)';
      default: return 'var(--status-default)';
    }
  };

  const getStatusLabel = (status: StatusEnum__1) => {
    switch(status) {
      case 'NOT_SENT': return 'Не отправлен';
      case 'DELIVERED_IN_PVZ': return 'Доставлен в ПВЗ';
      case 'RECEIVED': return 'Получен';
      default: return status;
    }
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
                <label>Статус:</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({
                    ...newProduct, 
                    status: e.target.value as StatusEnum__1
                  })}
                >
                  <option value="NOT_SENT">Не отправлен</option>
                  <option value="DELIVERED_IN_PVZ">Доставлен в ПВЗ</option>
                  <option value="RECEIVED">Получен</option>
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