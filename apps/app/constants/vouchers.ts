import { VoucherItem } from '@/types/voucher';

export const USER_CREDITS_DATA = {
  userName: 'Jakub',
  credits: 158,
};

export const VOUCHERS_DATA: VoucherItem[] = [
  {
    id: '1',
    brand: 'Nescafe',
    subtitle: 'Caffe Mocha',
    price: '1.29',
    currency: 'zł',
    credits: 158,
    backgroundColor: '#009B4E',
    image: require('@/assets/images/nescafe_cup.jpg'),
  },
  {
    id: '2',
    brand: 'Nivea',
    subtitle: 'Creame Care',
    price: '5.42',
    currency: 'zł',
    credits: 358,
    backgroundColor: '#2962FF',
    image: require('@/assets/images/nivea_bottle.jpg'),
  },
  {
    id: '3',
    brand: 'Nesquik',
    subtitle: 'Chocolate',
    price: '3.80',
    currency: 'zł',
    credits: 220,
    backgroundColor: '#F5B000',
    image: require('@/assets/images/nesquik_powder.jpg'),
  },
];
