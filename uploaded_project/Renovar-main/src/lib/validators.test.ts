import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateCPF,
  calculateAge,
  validateMinimumAge,
  formatCPF,
  formatPhone,
  formatCEP,
  fetchAddressByCep,
  type ViaCepResponse,
} from './validators';

describe('validateCPF', () => {
  it('should return true for valid CPF', () => {
    expect(validateCPF('11144477735')).toBe(true);
    expect(validateCPF('12345678909')).toBe(true);
  });

  it('should return true for valid formatted CPF', () => {
    expect(validateCPF('111.444.777-35')).toBe(true);
    expect(validateCPF('123.456.789-09')).toBe(true);
  });

  it('should return false for invalid CPF', () => {
    expect(validateCPF('11144477734')).toBe(false);
    expect(validateCPF('12345678900')).toBe(false);
  });

  it('should return false for CPF with wrong length', () => {
    expect(validateCPF('123456789')).toBe(false);
    expect(validateCPF('123456789012')).toBe(false);
  });

  it('should return false for CPF with all same digits', () => {
    expect(validateCPF('00000000000')).toBe(false);
    expect(validateCPF('11111111111')).toBe(false);
    expect(validateCPF('99999999999')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(validateCPF('')).toBe(false);
  });
});

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-23'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate age correctly', () => {
    expect(calculateAge('2000-01-01')).toBe(25);
    expect(calculateAge('1990-06-15')).toBe(34);
  });

  it('should handle birthday not yet occurred this year', () => {
    expect(calculateAge('2000-06-15')).toBe(24);
    expect(calculateAge('2000-12-31')).toBe(24);
  });

  it('should handle birthday already occurred this year', () => {
    expect(calculateAge('2000-01-01')).toBe(25);
    expect(calculateAge('2000-01-22')).toBe(25);
  });

  it('should handle birthday today', () => {
    expect(calculateAge('2000-01-23')).toBe(25);
  });
});

describe('validateMinimumAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-23'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for age above minimum', () => {
    expect(validateMinimumAge('2000-01-01', 18)).toBe(true);
    expect(validateMinimumAge('1990-01-01', 18)).toBe(true);
  });

  it('should return false for age below minimum', () => {
    expect(validateMinimumAge('2010-01-01', 18)).toBe(false);
    expect(validateMinimumAge('2020-01-01', 18)).toBe(false);
  });

  it('should use default minimum age of 18', () => {
    expect(validateMinimumAge('2000-01-01')).toBe(true);
    expect(validateMinimumAge('2010-01-01')).toBe(false);
  });

  it('should return false for empty birth date', () => {
    expect(validateMinimumAge('')).toBe(false);
  });

  it('should handle custom minimum age', () => {
    expect(validateMinimumAge('2005-01-01', 21)).toBe(false);
    expect(validateMinimumAge('2000-01-01', 21)).toBe(true);
  });
});

describe('formatCPF', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('11144477735')).toBe('111.444.777-35');
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
  });

  it('should format partially formatted CPF', () => {
    expect(formatCPF('111.444.77735')).toBe('111.444.777-35');
    expect(formatCPF('123456.789-09')).toBe('123.456.789-09');
  });

  it('should handle CPF with non-digits', () => {
    expect(formatCPF('111.444.777-35')).toBe('111.444.777-35');
    expect(formatCPF('abc11144477735def')).toBe('111.444.777-35');
  });

  it('should limit to 14 characters', () => {
    expect(formatCPF('11144477735123')).toBe('111.444.777-35');
  });

  it('should handle short input', () => {
    expect(formatCPF('111')).toBe('111');
    expect(formatCPF('111444')).toBe('111.444');
  });
});

describe('formatPhone', () => {
  it('should format 10-digit phone correctly', () => {
    expect(formatPhone('1198765432')).toBe('(11) 9876-5432');
    expect(formatPhone('2198765432')).toBe('(21) 9876-5432');
  });

  it('should format 11-digit phone correctly', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('21987654321')).toBe('(21) 98765-4321');
  });

  it('should format partially formatted phone', () => {
    expect(formatPhone('(11) 98765432')).toBe('(11) 9876-5432');
    expect(formatPhone('11 98765-4321')).toBe('(11) 98765-4321');
  });

  it('should handle phone with non-digits', () => {
    expect(formatPhone('(11) 9876-5432')).toBe('(11) 9876-5432');
    expect(formatPhone('abc11987654321def')).toBe('(11) 98765-4321');
  });

  it('should handle short input', () => {
    expect(formatPhone('11')).toBe('(11)');
    expect(formatPhone('11987')).toBe('(11) 987');
  });
});

describe('formatCEP', () => {
  it('should format CEP correctly', () => {
    expect(formatCEP('01234567')).toBe('01234-567');
    expect(formatCEP('12345678')).toBe('12345-678');
  });

  it('should format partially formatted CEP', () => {
    expect(formatCEP('01234-567')).toBe('01234-567');
    expect(formatCEP('01234567')).toBe('01234-567');
  });

  it('should handle CEP with non-digits', () => {
    expect(formatCEP('01234-567')).toBe('01234-567');
    expect(formatCEP('abc01234567def')).toBe('01234-567');
  });

  it('should limit to 9 characters', () => {
    expect(formatCEP('0123456789')).toBe('01234-567');
  });

  it('should handle short input', () => {
    expect(formatCEP('01234')).toBe('01234-');
    expect(formatCEP('012')).toBe('012');
  });
});

describe('fetchAddressByCep', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch address successfully', async () => {
    const mockResponse: ViaCepResponse = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      complemento: '',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchAddressByCep('01310100');

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
  });

  it('should handle formatted CEP', async () => {
    const mockResponse: ViaCepResponse = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      complemento: '',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchAddressByCep('01310-100');

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
  });

  it('should return null for invalid CEP length', async () => {
    const result1 = await fetchAddressByCep('12345');
    const result2 = await fetchAddressByCep('123456789');

    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should return null when API returns error', async () => {
    const mockResponse: ViaCepResponse = {
      cep: '',
      logradouro: '',
      complemento: '',
      bairro: '',
      localidade: '',
      uf: '',
      erro: true,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchAddressByCep('00000000');

    expect(result).toBeNull();
  });

  it('should return null on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchAddressByCep('01310100');

    expect(result).toBeNull();
  });
});
