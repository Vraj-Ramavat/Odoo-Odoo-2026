from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    company_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm',
                  'first_name', 'last_name', 'role', 'department', 'phone',
                  'company_code', 'company_name']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        company_code = validated_data.pop('company_code', None)
        company_name = validated_data.pop('company_name', None)

        from core.models import Company
        company = None
        if company_name:
            import uuid
            code = company_name.lower().strip().replace(' ', '-') + '-' + str(uuid.uuid4())[:4]
            company = Company.objects.create(name=company_name, code=code)
        elif company_code:
            company = Company.objects.filter(code=company_code).first()
            if not company:
                raise serializers.ValidationError({'company_code': 'Company code not found.'})
        else:
            company = Company.objects.get_or_create(code='default', defaults={'name': 'Default Company'})[0]

        user = User(**validated_data)
        user.company = company
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'department', 'department_name', 'phone',
                  'full_name', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns and lists."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role', 'department']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['company_id'] = user.company_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'company_id': self.user.company_id,
        }
        return data
