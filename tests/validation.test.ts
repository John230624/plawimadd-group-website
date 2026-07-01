import { registerSchema, loginSchema, contactSchema, productSchema, addressSchema } from '@/lib/validation';

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const data = { email: 'test@example.com', password: 'Abcd1234!' };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const data = { email: 'not-an-email', password: 'Abcd1234!' };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const data = { email: 'test@example.com', password: 'weak' };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const data = { email: 'test@example.com', password: 'anypassword' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const data = { email: 'test@example.com', password: '' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('contactSchema', () => {
  it('accepts valid contact data', () => {
    const data = {
      name: 'John',
      email: 'john@example.com',
      subject: 'Question',
      message: 'Hello, I have a question.',
    };
    const result = contactSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const data = { email: 'john@example.com', subject: 'Hi', message: 'Hello' };
    const result = contactSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('productSchema', () => {
  it('accepts valid product data', () => {
    const data = {
      name: 'Laptop',
      price: 999.99,
      stock: 10,
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    };
    const result = productSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects negative price', () => {
    const data = {
      name: 'Laptop',
      price: -10,
      stock: 10,
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    };
    const result = productSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('addressSchema', () => {
  it('accepts valid address data', () => {
    const data = {
      fullName: 'John Doe',
      phoneNumber: '+22890123456',
      area: 'Quartier',
      city: 'Lomé',
      state: 'Maritime',
      country: 'Togo',
    };
    const result = addressSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
