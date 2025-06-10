import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../features/auth/authSlice';
import { getSuppliesByPickUpPoint, updateSupplyReadyStatus } from '../service/supplyService';
import { getWorkerByUserId } from '../service/workerService';
import { getPickUpPointById } from '../service/pickUpPointService';
import { getUserById } from '../service/userService';
import { SupplyType } from '../types/supplyType';
import { getDriverById } from '../service/driverService';
import { getAllProducts, updateProductStatus } from '../service/productService';
import { productType, StatusEnum__2 } from '../types/productType'; // Импортируем тип продукта
import '../styles/PvzSupplies.css';

type SupplyStatus = 'pending' | 'processing';

interface EnhancedSupply extends SupplyType {
  status: SupplyStatus;
  pickUpPointAddress: string;
  driverPhone: string;
  driverName: string;
}

const PvzSupplies = () => {
  const token = useSelector(selectAuthToken);
  const userId = Number(localStorage.getItem('userId'));
  
  const [supplies, setSupplies] = useState<EnhancedSupply[]>([]);
  const [loading, setLoading] = useState({
    initial: true,
    updating: false,
    updatingProducts: false
  });
  const [error, setError] = useState<string | null>(null);
  const [currentPvz, setCurrentPvz] = useState<{
    id: number;
    address: string;
  } | null>(null);
  
  const [supplyToUpdate, setSupplyToUpdate] = useState<SupplyType | null>(null);

  // Проверка дат
  const isToday = (dateString: string) => 
    new Date(dateString).toDateString() === new Date().toDateString();
  
  const isPastDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date < now && !isToday(dateString);
  };

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(prev => ({ ...prev, initial: true }));
        
        const worker = await getWorkerByUserId(userId);
        const pvzId = Number(worker.pick_up_point_id);
        const pvz = await getPickUpPointById(pvzId);
        
        setCurrentPvz({ id: pvzId, address: pvz.address });
        
        const suppliesData = await getSuppliesByPickUpPoint(pvzId);
        const enhancedSupplies = await enhanceSuppliesData(suppliesData.data);
        
        setSupplies(enhancedSupplies.filter(s => !isPastDate(s.time)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        console.error('Ошибка загрузки:', err);
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    if (userId && token) loadData();
  }, [userId, token]);

  // Обработка обновлений
  useEffect(() => {
    const processUpdate = async () => {
      if (!supplyToUpdate || !token) return;
      
      try {
        setLoading(prev => ({ ...prev, updating: true }));
        setError(null);
        
        // 1. Обновляем статус поставки
        await updateSupplyReadyStatus(supplyToUpdate.id, supplyToUpdate);
        
        // 2. Получаем все товары для этой поставки
        const productsResponse = await getAllProducts();
        const productsForSupply = productsResponse.data.filter(
          (product: productType) => product.supply_id === supplyToUpdate.id
        );
        
        // 3. Обновляем статус каждого товара
        setLoading(prev => ({ ...prev, updatingProducts: true }));
        await Promise.all(
          productsForSupply.map((product: productType) => 
            updateProductStatus(product.id, {
              ...product,
              status: 'DELIVERED_IN_PVZ' as StatusEnum__2
            })
          )
        );
        
        // 4. Обновляем состояние
        setSupplies(prev => prev.map(s => 
          s.id === supplyToUpdate.id ? { ...s, ready: true } : s
        ));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка обновления статуса');
        console.error('Ошибка обновления:', err);
      } finally {
        setLoading(prev => ({ 
          ...prev, 
          updating: false,
          updatingProducts: false 
        }));
        setSupplyToUpdate(null);
      }
    };

    processUpdate();
  }, [supplyToUpdate, token]);

  // Обогащение данных поставки
  const enhanceSuppliesData = async (supplies: SupplyType[]): Promise<EnhancedSupply[]> => {
    try {
      return await Promise.all(supplies.map(async supply => {
        const point = await getPickUpPointById(supply.pick_up_point_id);
        
        let driverInfo = { phone: 'Не указан', name: 'Не указан' };
        if (supply.driver_id) {
          const driver = await getDriverById(supply.driver_id);
          const user = await getUserById(driver.user_id);
          driverInfo = {
            phone: user.phone_number || 'Не указан',
            name: `${user.surname} ${user.name} ${user.last_name}`.trim()
          };
        }
        
        return {
          ...supply,
          status: isToday(supply.time) ? 'processing' : 'pending',
          pickUpPointAddress: point.address,
          driverPhone: driverInfo.phone,
          driverName: driverInfo.name
        };
      }));
    } catch (err) {
      console.error('Ошибка обогащения данных:', err);
      throw err;
    }
  };

  // Обработчик принятия поставки
  const handleAcceptDelivery = (supplyId: number) => {
    const supply = supplies.find(s => s.id === supplyId);
    if (!supply) return;

    setSupplyToUpdate({
      ...supply,
      ready: true
    });
  };

  // Форматирование даты
  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (loading.initial) return <div className="loading">Загрузка данных...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!currentPvz) return <div className="error">Не удалось загрузить данные ПВЗ</div>;

  return (
    <div className="pvz-supplies">
      <header>
        <h1>Поставки в пункт выдачи</h1>
        <div className="pvz-info">
          <h3>ПВЗ #{currentPvz.id}</h3>
          <p>{currentPvz.address}</p>
        </div>
      </header>
      
      <div className="supplies-list">
        {supplies.length > 0 ? (
          <div className="supply-cards">
            {supplies
              .sort((a, b) => 
                a.status === 'processing' ? -1 : 
                b.status === 'processing' ? 1 : 
                new Date(a.time).getTime() - new Date(b.time).getTime()
              )
              .map(supply => (
                <div key={supply.id} className={`supply-card ${supply.status}`}>
                  <div className="card-header">
                    <h3>Поставка #{supply.id}</h3>
                    <span className={`status ${supply.status}`}>
                      {supply.status === 'processing' ? 'Сегодня' : 'Запланирована'}
                    </span>
                  </div>
                  
                  <div className="card-details">
                    <Detail label="Дата и время" value={formatDate(supply.time)} />
                    <Detail label="Адрес ПВЗ" value={supply.pickUpPointAddress} />
                    
                    {supply.driver_id && (
                      <>
                        <Detail label="Водитель" value={supply.driverName} />
                        <Detail 
                          label="Телефон" 
                          value={
                            <a href={`tel:${supply.driverPhone}`}>
                              {supply.driverPhone}
                            </a>
                          } 
                        />
                      </>
                    )}
                    
                    <div className="delivery-action">
                      {supply.ready ? (
                        <div className="accepted">
                          <span>Поставка принята</span>
                          <span>✓</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAcceptDelivery(supply.id)}
                          disabled={
                            loading.updating && supplyToUpdate?.id === supply.id ||
                            loading.updatingProducts
                          }
                        >
                          {loading.updating && supplyToUpdate?.id === supply.id
                            ? 'Обновление статуса...'
                            : loading.updatingProducts
                              ? 'Обновление товаров...'
                              : 'Принять поставку'
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="empty">Нет активных поставок</div>
        )}
      </div>
    </div>
  );
};

// Вспомогательный компонент для деталей
const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail">
    <span className="label">{label}:</span>
    <span className="value">{value}</span>
  </div>
);

export default PvzSupplies;