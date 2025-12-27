import os
import urllib.request
import time
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from api.models import Vehicle, LoanApplication

class Command(BaseCommand):
    help = 'Seeds vehicle data: 30 cars + 30 bikes'

    def handle(self, *args, **kwargs):
        self.stdout.write('Cleaning existing vehicle data...')
        # Cascade delete will handle related objects if configured, but let's be safe
        LoanApplication.objects.all().delete()
        Vehicle.objects.all().delete()
        self.stdout.write('Database cleaned.')

        # 30 Cars Data
        cars = [
            # Electric
            {'name': 'Tesla Model 3', 'brand': 'Tesla', 'model': 'Model 3', 'year': 2024, 'vehicle_type': 'car', 'fuel_type': 'electric', 'price': 6500000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2019_Tesla_Model_3_Performance_AWD_Front.jpg/800px-2019_Tesla_Model_3_Performance_AWD_Front.jpg'},
            {'name': 'BYD Atto 3', 'brand': 'BYD', 'model': 'Atto 3', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'electric', 'price': 5599000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/BYD_Atto_3_Japan_version_front-right_20230225.jpg/800px-BYD_Atto_3_Japan_version_front-right_20230225.jpg'},
            {'name': 'MG ZS EV', 'brand': 'MG', 'model': 'ZS EV', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'electric', 'price': 5299000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/MG_ZS_EV_%282021_facelift%29_IMG_5244.jpg/800px-MG_ZS_EV_%282021_facelift%29_IMG_5244.jpg'},
            {'name': 'Tata Nexon EV', 'brand': 'Tata', 'model': 'Nexon EV Max', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'electric', 'price': 4600000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Tata_Nexon_EV_IMG_4569.jpg/800px-Tata_Nexon_EV_IMG_4569.jpg'},
            {'name': 'Hyundai Kona Electric', 'brand': 'Hyundai', 'model': 'Kona EV', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'electric', 'price': 5996000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Hyundai_Kona_Electric_%28SX2%29_IMG_7030.jpg/800px-Hyundai_Kona_Electric_%28SX2%29_IMG_7030.jpg'},
            {'name': 'Kia Niro EV', 'brand': 'Kia', 'model': 'Niro EV', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'electric', 'price': 6990000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kia_Niro_EV_%28SG2%29_IMG_6424.jpg/800px-Kia_Niro_EV_%28SG2%29_IMG_6424.jpg'},
            {'name': 'Nissan Leaf', 'brand': 'Nissan', 'model': 'Leaf', 'year': 2023, 'vehicle_type': 'car', 'fuel_type': 'electric', 'price': 6299000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2018_Nissan_Leaf_Tekna_Front.jpg/800px-2018_Nissan_Leaf_Tekna_Front.jpg'},
            {'name': 'Mahindra XUV400', 'brand': 'Mahindra', 'model': 'XUV400', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'electric', 'price': 4800000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Mahindra_XUV400_EV.jpg/800px-Mahindra_XUV400_EV.jpg'},
            {'name': 'Citroen eC3', 'brand': 'Citroen', 'model': 'eC3', 'year': 2024, 'vehicle_type': 'car', 'fuel_type': 'electric', 'price': 3200000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Citro%C3%ABn_%C3%AB-C3_front.jpg/800px-Citro%C3%ABn_%C3%AB-C3_front.jpg'},
            {'name': 'Tata Tiago EV', 'brand': 'Tata', 'model': 'Tiago EV', 'year': 2024, 'vehicle_type': 'car', 'fuel_type': 'electric', 'price': 2500000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Tata_Tiago_EV.jpg/800px-Tata_Tiago_EV.jpg'},
            
            # Hybrid
            {'name': 'Toyota RAV4 Hybrid', 'brand': 'Toyota', 'model': 'RAV4', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'hybrid', 'price': 14500000, 'max_loan_percentage': 70, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2019_Toyota_RAV4_XLE_Hybrid_AWD%2C_front_1.4.20.jpg/800px-2019_Toyota_RAV4_XLE_Hybrid_AWD%2C_front_1.4.20.jpg'},
            {'name': 'Toyota Corolla Cross', 'brand': 'Toyota', 'model': 'Corolla Cross', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'hybrid', 'price': 12000000, 'max_loan_percentage': 70, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Toyota_Corolla_Cross_Hybrid_Z_%286AA-ZVG11-KHXEB%29_front.jpg/800px-Toyota_Corolla_Cross_Hybrid_Z_%286AA-ZVG11-KHXEB%29_front.jpg'},
            {'name': 'Suzuki Grand Vitara', 'brand': 'Suzuki', 'model': 'Grand Vitara', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'hybrid', 'price': 8500000, 'max_loan_percentage': 75, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/123185/grand-vitara-exterior-right-front-three-quarter-2.jpeg'},
            {'name': 'Honda City e:HEV', 'brand': 'Honda', 'model': 'City Hybrid', 'year': 2023, 'vehicle_type': 'car', 'fuel_type': 'hybrid', 'price': 6000000, 'max_loan_percentage': 75, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/2020_Honda_City_1.5_RS_e_HEV_GN3_%2820201205%29_01.jpg/800px-2020_Honda_City_1.5_RS_e_HEV_GN3_%2820201205%29_01.jpg'},
            {'name': 'Toyota Yaris Cross', 'brand': 'Toyota', 'model': 'Yaris Cross', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'hybrid', 'price': 9000000, 'max_loan_percentage': 70, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Toyota_Yaris_Cross_Hybrid_Z_%286AA-MXPJ10-BHXGB%29_front.jpg/800px-Toyota_Yaris_Cross_Hybrid_Z_%286AA-MXPJ10-BHXGB%29_front.jpg'},
            
            # Petrol (SUVs/Cars popular in Nepal)
            {'name': 'Hyundai Creta', 'brand': 'Hyundai', 'model': 'Creta', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 4500000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2020_Hyundai_Creta_1.5_Plus_%28Indonesia%29%2C_front_view.jpg/800px-2020_Hyundai_Creta_1.5_Plus_%28Indonesia%29%2C_front_view.jpg'},
            {'name': 'Kia Seltos', 'brand': 'Kia', 'model': 'Seltos', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 4800000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Kia_Seltos_SP2_PE_Gravity_Gray_2.jpg/800px-Kia_Seltos_SP2_PE_Gravity_Gray_2.jpg'},
            {'name': 'Suzuki Brezza', 'brand': 'Suzuki', 'model': 'Brezza', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 4200000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/2022_Maruti_Suzuki_Brezza_ZXi_Plus_%28India%29_front_view_01.jpg/800px-2022_Maruti_Suzuki_Brezza_ZXi_Plus_%28India%29_front_view_01.jpg'},
            {'name': 'Suzuki Swift', 'brand': 'Suzuki', 'model': 'Swift', 'year': 2024, 'vehicle_type': 'car', 'fuel_type': 'petrol', 'price': 3500000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/2018_Suzuki_Swift_SZ5_Boosterjet_SHVS_1.0_Front.jpg/800px-2018_Suzuki_Swift_SZ5_Boosterjet_SHVS_1.0_Front.jpg'},
            {'name': 'Hyundai Venue', 'brand': 'Hyundai', 'model': 'Venue', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 4000000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hyundai_Venue_Facelift_%28front_view%29.jpg/800px-Hyundai_Venue_Facelift_%28front_view%29.jpg'},
            {'name': 'Tata Punch', 'brand': 'Tata', 'model': 'Punch', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 3200000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tata_Punch_Creative_AMT_Tropical_Mist_Front_Left.jpg/800px-Tata_Punch_Creative_AMT_Tropical_Mist_Front_Left.jpg'},
            {'name': 'Mahindra Scorpio N', 'brand': 'Mahindra', 'model': 'Scorpio N', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'diesel', 'price': 7500000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/2022_Mahindra_Scorpio-N_Z8L_%28India%29_front_view.jpg/800px-2022_Mahindra_Scorpio-N_Z8L_%28India%29_front_view.jpg'},
            {'name': 'Jeep Compass', 'brand': 'Jeep', 'model': 'Compass', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'diesel', 'price': 9000000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Jeep_Compass_%28MP%29_Facelift_IMG_5076.jpg/800px-Jeep_Compass_%28MP%29_Facelift_IMG_5076.jpg'},
            {'name': 'Ford Everest', 'brand': 'Ford', 'model': 'Everest', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'diesel', 'price': 19000000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/2022_Ford_Everest_Sport_%28U704%29_front.jpg/800px-2022_Ford_Everest_Sport_%28U704%29_front.jpg'},
            {'name': 'Volkswagen Taigun', 'brand': 'Volkswagen', 'model': 'Taigun', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 5200000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Volkswagen_Taigun_IMG_4954.jpg/800px-Volkswagen_Taigun_IMG_4954.jpg'},
            {'name': 'Skoda Kushaq', 'brand': 'Skoda', 'model': 'Kushaq', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 5000000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Skoda_Kushaq_IMG_4917.jpg/800px-Skoda_Kushaq_IMG_4917.jpg'},
            {'name': 'Honda Elevate', 'brand': 'Honda', 'model': 'Elevate', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 4900000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Honda_Elevate_ZX.jpg/800px-Honda_Elevate_ZX.jpg'},
            {'name': 'Renault Kiger', 'brand': 'Renault', 'model': 'Kiger', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 3300000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/2021_Renault_Kiger_RXZ_Turbo_CVT_%28front%29.jpg/800px-2021_Renault_Kiger_RXZ_Turbo_CVT_%28front%29.jpg'},
            {'name': 'Nissan Magnite', 'brand': 'Nissan', 'model': 'Magnite', 'year': 2023, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 3000000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/2021_Nissan_Magnite_XV_Premium_Turbo_%28front%29.jpg/800px-2021_Nissan_Magnite_XV_Premium_Turbo_%28front%29.jpg'},
            {'name': 'Suzuki Jimny', 'brand': 'Suzuki', 'model': 'Jimny 5-Door', 'year': 2024, 'vehicle_type': 'suv', 'fuel_type': 'petrol', 'price': 3800000, 'max_loan_percentage': 50, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2023_Suzuki_Jimny_5-door_GLX.jpg/800px-2023_Suzuki_Jimny_5-door_GLX.jpg'},
        ]

        # 30 Bikes Data
        bikes = [
            {'name': 'Honda Hornet 2.0', 'brand': 'Honda', 'model': 'Hornet 2.0', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 469900, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Honda_Hornet_2.0.jpg/800px-Honda_Hornet_2.0.jpg'},
            {'name': 'Honda NX 200', 'brand': 'Honda', 'model': 'NX 200', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 479900, 'max_loan_percentage': 80, 'image_url': 'https://bd.gaadicdn.com/processedimages/honda/cb200x/source/cb200x64e43b1c67623.jpg'},
            {'name': 'Royal Enfield Classic 350', 'brand': 'Royal Enfield', 'model': 'Classic 350', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 650000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Royal_Enfield_Classic_350_2022.jpg/800px-Royal_Enfield_Classic_350_2022.jpg'},
            {'name': 'Royal Enfield Hunter 350', 'brand': 'Royal Enfield', 'model': 'Hunter 350', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 450000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/124719/hunter-350-right-front-three-quarter.jpeg'},
            {'name': 'Royal Enfield Meteor 350', 'brand': 'Royal Enfield', 'model': 'Meteor 350', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 700000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/RE_Meteor_350_Stellar_Black.jpg/800px-RE_Meteor_350_Stellar_Black.jpg'},
            {'name': 'Yamaha MT-15', 'brand': 'Yamaha', 'model': 'MT-15 V2', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 520000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Yamaha_MT-15.jpg/800px-Yamaha_MT-15.jpg'},
            {'name': 'Yamaha R15 V4', 'brand': 'Yamaha', 'model': 'R15 V4', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 580000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Yamaha_YZF-R15M.jpg/800px-Yamaha_YZF-R15M.jpg'},
            {'name': 'Yamaha FZ-S', 'brand': 'Yamaha', 'model': 'FZ-S V3', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 380000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/46754/yamaha-fz-s-v3-exterior-right-front-three-quarter.jpeg'},
            {'name': 'Bajaj Pulsar NS200', 'brand': 'Bajaj', 'model': 'Pulsar NS200', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 400000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Bajaj_Pulsar_200NS.jpg/800px-Bajaj_Pulsar_200NS.jpg'},
            {'name': 'Bajaj Pulsar N250', 'brand': 'Bajaj', 'model': 'Pulsar N250', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 480000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/104639/pulsar-n250-right-front-three-quarter-3.jpeg'},
            {'name': 'Bajaj Dominar 400', 'brand': 'Bajaj', 'model': 'Dominar 400', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 600000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Bajaj_Dominar_400_2019.jpg/800px-Bajaj_Dominar_400_2019.jpg'},
            {'name': 'KTM Duke 200', 'brand': 'KTM', 'model': 'Duke 200', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 580000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/KTM_200_Duke_2012.jpg/800px-KTM_200_Duke_2012.jpg'},
            {'name': 'KTM Duke 390', 'brand': 'KTM', 'model': 'Duke 390', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 990000, 'max_loan_percentage': 70, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/KTM_390_Duke_2017.jpg/800px-KTM_390_Duke_2017.jpg'},
            {'name': 'KTM RC 200', 'brand': 'KTM', 'model': 'RC 200', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 650000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/KTM_RC_390.jpg/800px-KTM_RC_390.jpg'},
            {'name': 'TVS Apache RTR 200 4V', 'brand': 'TVS', 'model': 'Apache RTR 200', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 390000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/46777/apache-rtr-200-4v-right-front-three-quarter.jpeg'},
            {'name': 'TVS Apache RR 310', 'brand': 'TVS', 'model': 'Apache RR 310', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 799000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/TVS_Apache_RR_310.jpg/800px-TVS_Apache_RR_310.jpg'},
            {'name': 'TVS Raider 125', 'brand': 'TVS', 'model': 'Raider 125', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 280000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/103183/raider-125-right-front-three-quarter-3.jpeg'},
            {'name': 'Suzuki Gixxer 250', 'brand': 'Suzuki', 'model': 'Gixxer 250', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 480000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/124119/gixxer-250-right-front-three-quarter.jpeg'},
            {'name': 'Hero Xpulse 200', 'brand': 'Hero', 'model': 'Xpulse 200 4V', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 420000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/103817/xpulse-200-4v-right-front-three-quarter-2.jpeg'},
             # Scooters
            {'name': 'Honda Dio', 'brand': 'Honda', 'model': 'Dio BS6', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 260000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/44726/dio-bs6-right-front-three-quarter.jpeg'},
            {'name': 'Honda Grazia', 'brand': 'Honda', 'model': 'Grazia 125', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 290000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/46726/grazia-125-right-front-three-quarter.jpeg'},
            {'name': 'Yamaha Ray ZR', 'brand': 'Yamaha', 'model': 'Ray ZR 125', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'hybrid', 'price': 295000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/46761/ray-zr-125-right-front-three-quarter.jpeg'},
            {'name': 'TVS Ntorq 125', 'brand': 'TVS', 'model': 'Ntorq 125 Race XP', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 310000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/99635/ntorq-125-right-front-three-quarter.jpeg'},
            {'name': 'Suzuki Access 125', 'brand': 'Suzuki', 'model': 'Access 125', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 285000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/43477/access-125-right-front-three-quarter.jpeg'},
            {'name': 'Aprilia SR 160', 'brand': 'Aprilia', 'model': 'SR 160', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 350000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/46797/sr-160-right-front-three-quarter.jpeg'},
            {'name': 'Vespa SXL 150', 'brand': 'Vespa', 'model': 'SXL 150', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'petrol', 'price': 420000, 'max_loan_percentage': 80, 'image_url': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/46791/sxl-150-right-front-three-quarter.jpeg'},
            
            # Electric Bikes/Scooters
            {'name': 'Ather 450X', 'brand': 'Ather', 'model': '450X Gen 3', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'electric', 'price': 420000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Ather_450X_Launch_Event.jpg/800px-Ather_450X_Launch_Event.jpg'},
            {'name': 'Ola S1 Pro', 'brand': 'Ola Electric', 'model': 'S1 Pro', 'year': 2024, 'vehicle_type': 'two_wheeler', 'fuel_type': 'electric', 'price': 380000, 'max_loan_percentage': 80, 'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Ola_S1_Pro.jpg/800px-Ola_S1_Pro.jpg'},
            {'name': 'Yatri Project One', 'brand': 'Yatri', 'model': 'Project One', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'electric', 'price': 1900000, 'max_loan_percentage': 80, 'image_url': 'https://yatrimotorcycles.com/static/005e55e8d5e0a0d0d8f8d5f60b4e2f9f/0b3d6/p1-01.jpg'},
            {'name': 'Yatri Project Zero', 'brand': 'Yatri', 'model': 'Project Zero', 'year': 2023, 'vehicle_type': 'two_wheeler', 'fuel_type': 'electric', 'price': 1950000, 'max_loan_percentage': 80, 'image_url': 'https://yatrimotorcycles.com/static/8c7f9d8f6d8c0b5d5d8c0b5d5d8c0b5d/0b3d6/p0-01.jpg'}
        ]

        all_vehicles = cars + bikes
        if len(all_vehicles) < 60:
            self.stdout.write(f'Warning: Only {len(all_vehicles)} vehicles defined.')

        self.stdout.write(f'Seeding {len(all_vehicles)} vehicles with images...')
        
        # Create user agent header
        opener = urllib.request.build_opener()
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        urllib.request.install_opener(opener)

        for data in all_vehicles:
            image_url = data.pop('image_url', None)
            
            # Default description
            if 'description' not in data:
                data['description'] = f"{data['year']} {data['brand']} {data['model']} - High performance {data['fuel_type']} vehicle."

            vehicle = Vehicle.objects.create(**data)
            
            if image_url:
                try:
                    # Short sleep to prevent rate limiting
                    time.sleep(0.5) 
                    self.stdout.write(f'Downloading image for {vehicle.name}...')
                    
                    try:
                        with urllib.request.urlopen(image_url, timeout=10) as response:
                            if response.status == 200:
                                file_content = response.read()
                                file_name = f"{vehicle.brand}_{vehicle.model}_{int(time.time())}.jpg".replace(" ", "_").lower()
                                vehicle.image.save(file_name, ContentFile(file_content), save=True)
                                self.stdout.write(self.style.SUCCESS(f'Saved image for {vehicle.name}'))
                            else:
                                self.stdout.write(self.style.WARNING(f'Failed to download for {vehicle.name}: Status {response.status}'))
                    except urllib.error.HTTPError as e:
                         self.stdout.write(self.style.WARNING(f'HTTP Error for {vehicle.name}: {e.code}'))
                    except Exception as e:
                         self.stdout.write(self.style.WARNING(f'Error downloading {vehicle.name}: {str(e)}'))

                except Exception as e:
                     self.stdout.write(self.style.ERROR(f'Critical error for {vehicle.name}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {Vehicle.objects.count()} vehicles'))
