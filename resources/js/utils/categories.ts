// Единый источник правды для категорий задач Petopia
// Цвета строго по Design.txt и реализации на страницах (Calendar, Dashboard, HealthRecords)

export interface Category {
  name: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { name: 'Кормление', color: '#DA985D' },
  { name: 'Поение', color: '#4CA9B3' },
  { name: 'Прогулка', color: '#6D8967' },
  { name: 'Игры', color: '#984343' },
  { name: 'Лекарство', color: '#C4585A' },
  { name: 'Гигиена', color: '#11759D' },
  { name: 'Ветеринар', color: '#5E8086' },
  { name: 'Укол', color: '#625AAE' },
  { name: 'Обучение', color: '#906889' },
  { name: 'Груминг', color: '#847452' },
  { name: 'Уборка', color: '#8F5E5E' },
  { name: 'Другое', color: '#6F6F6F' },
];

export const MEDICAL_CATEGORIES = ['Лекарство', 'Ветеринар', 'Укол'];

export const getCategoryColor = (type: string): string => {
  const found = CATEGORIES.find((c) => c.name === type);
  return found ? found.color : '#6F6F6F';
};

// Удобный массив имён (для select/валидаций при необходимости)
export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
