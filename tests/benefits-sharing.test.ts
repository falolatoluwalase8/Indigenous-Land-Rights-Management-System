import { describe, it, expect, beforeEach } from 'vitest';

// Mock the Clarity contract interactions
const mockAgreements = new Map();
const mockPayments = new Map();
const mockPaymentCounters = new Map();
let mockAgreementCounter = 0;
const mockAdmin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
let currentSender = mockAdmin;

// Mock contract functions
const benefitSharing = {
  createAgreement: (territoryId, communityId, company, activityType, compensationAmount, compensationFrequency) => {
    if (currentSender !== mockAdmin) {
      return { err: 403 };
    }
    
    const agreementId = mockAgreementCounter + 1;
    mockAgreements.set(agreementId, {
      territoryId,
      communityId,
      company,
      activityType,
      compensationAmount,
      compensationFrequency,
      startHeight: 123, // Mock block height
      endHeight: null,
      active: true
    });
    mockPaymentCounters.set(agreementId, 0);
    mockAgreementCounter = agreementId;
    return { ok: agreementId };
  },
  
  recordPayment: (agreementId, amount, receivedBy) => {
    if (currentSender !== mockAdmin) {
      return { err: 403 };
    }
    
    const agreement = mockAgreements.get(agreementId);
    if (!agreement) {
      return { err: 404 };
    }
    
    if (!agreement.active) {
      return { err: 403 };
    }
    
    const counter = mockPaymentCounters.get(agreementId);
    if (counter === undefined) {
      return { err: 404 };
    }
    
    const paymentId = counter + 1;
    const key = `${agreementId}-${paymentId}`;
    mockPayments.set(key, {
      amount,
      paidAt: 123, // Mock block height
      receivedBy
    });
    mockPaymentCounters.set(agreementId, paymentId);
    return { ok: paymentId };
  },
  
  endAgreement: (agreementId) => {
    if (currentSender !== mockAdmin) {
      return { err: 403 };
    }
    
    const agreement = mockAgreements.get(agreementId);
    if (!agreement) {
      return { err: 404 };
    }
    
    agreement.endHeight = 123; // Mock block height
    agreement.active = false;
    mockAgreements.set(agreementId, agreement);
    return { ok: true };
  },
  
  getAgreement: (agreementId) => {
    return mockAgreements.get(agreementId) || null;
  },
  
  getPayment: (agreementId, paymentId) => {
    const key = `${agreementId}-${paymentId}`;
    return mockPayments.get(key) || null;
  }
};

describe('Benefit Sharing Contract', () => {
  beforeEach(() => {
    mockAgreements.clear();
    mockPayments.clear();
    mockPaymentCounters.clear();
    mockAgreementCounter = 0;
    currentSender = mockAdmin;
  });
  
  it('should create a new benefit agreement', () => {
    const territoryId = 1;
    const communityId = 1;
    const company = 'ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const activityType = 4; // Logging
    const compensationAmount = 1000;
    const compensationFrequency = 30; // Every 30 blocks
    
    const result = benefitSharing.createAgreement(
        territoryId, communityId, company, activityType, compensationAmount, compensationFrequency
    );
    expect(result).toHaveProperty('ok');
    expect(result.ok).toBe(1);
    
    const agreement = benefitSharing.getAgreement(1);
    expect(agreement).not.toBeNull();
    expect(agreement.territoryId).toBe(territoryId);
    expect(agreement.communityId).toBe(communityId);
    expect(agreement.company).toBe(company);
    expect(agreement.compensationAmount).toBe(compensationAmount);
    expect(agreement.active).toBe(true);
  });
  
  it('should record a payment for an agreement', () => {
    // Create an agreement first
    benefitSharing.createAgreement(1, 1, 'ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 4, 1000, 30);
    
    const amount = 1000;
    const receivedBy = 'ST5PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    const result = benefitSharing.recordPayment(1, amount, receivedBy);
    expect(result).toHaveProperty('ok');
    expect(result.ok).toBe(1);
    
    const payment = benefitSharing.getPayment(1, 1);
    expect(payment).not.toBeNull();
    expect(payment.amount).toBe(amount);
    expect(payment.receivedBy).toBe(receivedBy);
  });
  
  it('should end an agreement', () => {
    // Create an agreement first
    benefitSharing.createAgreement(1, 1, 'ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 4, 1000, 30);
    
    const result = benefitSharing.endAgreement(1);
    expect(result).toHaveProperty('ok');
    expect(result.ok).toBe(true);
    
    const agreement = benefitSharing.getAgreement(1);
    expect(agreement.active).toBe(false);
    expect(agreement.endHeight).not.toBeNull();
  });
  
  it('should not allow recording payment for inactive agreement', () => {
    // Create an agreement first
    benefitSharing.createAgreement(1, 1, 'ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 4, 1000, 30);
    
    // End the agreement
    benefitSharing.endAgreement(1);
    
    // Try to record payment
    const result = benefitSharing.recordPayment(1, 1000, 'ST5PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    expect(result).toHaveProperty('err');
    expect(result.err).toBe(403);
  });
});
