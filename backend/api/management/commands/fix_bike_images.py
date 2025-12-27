import os
import urllib.request
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from api.models import Vehicle

class Command(BaseCommand):
    help = 'Fixes images for specific bikes'

    def handle(self, *args, **kwargs):
        updates = [
            {
                'name': 'Honda Hornet 2.0',
                'urls': [
                    'https://bd.gaadicdn.com/processedimages/honda/hornet-20/source/hornet-2064e70df447a11.jpg',
                    'https://images.carandbike.com/bike-images/colors/honda/hornet-20/honda-hornet-20-matte-sangria-red-metallic.png'
                ]
            },
            {
                'name': 'Honda NX 200',
                'urls': [
                    'https://static.autox.com/uploads/bikes/2021/08/honda-cb200x-launched-in-india-at-rs-1-44-lakh.jpg',
                    'https://i.ytimg.com/vi/y-7Fk0y3GkI/maxresdefault.jpg',
                    'https://bd.gaadicdn.com/processedimages/honda/cb200x/source/cb200x64e43b1c67623.jpg',
                    'https://images.carandbike.com/bike-images/colors/honda/cb200x/honda-cb200x-pearl-nightstar-black.png'
                ]
            }
        ]

        opener = urllib.request.build_opener()
        # Use a very standard chrome user agent
        opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')]
        urllib.request.install_opener(opener)

        for item in updates:
            try:
                vehicle = Vehicle.objects.get(name=item['name'])
                self.stdout.write(f"Updating image for {vehicle.name}...")
                
                success = False
                for url in item['urls']:
                    try:
                        self.stdout.write(f"Trying {url}...")
                        with urllib.request.urlopen(url, timeout=10) as response:
                            if response.status == 200:
                                file_content = response.read()
                                file_name = f"{vehicle.name.replace(' ', '_').lower()}.jpg"
                                vehicle.image.save(file_name, ContentFile(file_content), save=True)
                                self.stdout.write(self.style.SUCCESS(f"Successfully updated {vehicle.name}"))
                                success = True
                                break
                    except Exception as e:
                        self.stdout.write(f"Failed {url}: {e}")
                
                if not success:
                    self.stdout.write(self.style.ERROR(f"All URLs failed for {vehicle.name}"))
                    
            except Vehicle.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"Vehicle {item['name']} not found"))
