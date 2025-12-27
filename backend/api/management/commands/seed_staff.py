from django.core.management.base import BaseCommand
from api.models import User

class Command(BaseCommand):
    help = 'Seed staff users (Admin, Sales Rep, Finance Manager)'

    def handle(self, *args, **kwargs):
        users = [
            {
                'username': 'admin', 
                'email': 'admin@example.com', 
                'password': 'admin', 
                'user_type': 'admin', 
                'is_superuser': True, 
                'is_staff': True
            },
            {
                'username': 'sales', 
                'email': 'sales@example.com', 
                'password': 'sales', 
                'user_type': 'sales_rep', 
                'is_superuser': False, 
                'is_staff': True
            },
            {
                'username': 'finance', 
                'email': 'finance@example.com', 
                'password': 'finance', 
                'user_type': 'finance_manager', 
                'is_superuser': False, 
                'is_staff': True
            },
        ]

        self.stdout.write('Seeding staff users...')

        for u in users:
            if not User.objects.filter(username=u['username']).exists():
                if u.get('is_superuser'):
                    User.objects.create_superuser(
                        username=u['username'],
                        email=u['email'],
                        password=u['password'],
                        user_type=u['user_type']
                    )
                else:
                    User.objects.create_user(
                        username=u['username'],
                        email=u['email'],
                        password=u['password'],
                        user_type=u['user_type'],
                        is_staff=u['is_staff']
                    )
                
                self.stdout.write(self.style.SUCCESS(f"Created {u['user_type']}: {u['username']} / {u['password']}"))
            else:
                self.stdout.write(self.style.WARNING(f"User {u['username']} already exists"))
