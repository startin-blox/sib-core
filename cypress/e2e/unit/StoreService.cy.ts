import { StoreFactory } from '../../../src/libs/store/StoreFactory.ts';
import { StoreType } from '../../../src/libs/store/shared/types.ts';
import { StoreService } from '../../../src/libs/store/storeService.ts';

/** Reusable configs */
const LDP_CONFIG = { type: StoreType.LDP } as const;
const FC_CONFIG_MIN = {
  type: StoreType.FederatedCatalogue,
  endpoint: 'https://mock-fc.test/fc',
  login: {
    kc_url: 'https://mock-fc.test/auth/realms/test/protocol/openid-connect/token',
    kc_grant_type: 'password',
    kc_client_id: 'mock-client-id',
    kc_client_secret: 'mock-secret',
    kc_username: 'mock_user',
    kc_password: 'mock_password',
  },
  optionsServer: {
    kc_url: 'https://mock-fc.test/auth/realms/test/protocol/openid-connect/token',
    kc_grant_type: 'password',
    kc_scope: 'openid',
  },
  temsServiceBase: 'https://mock-api.test/services/',
  temsCategoryBase: 'https://mock-api.test/providers/categories/',
  temsImageBase: 'https://mock-api.test/objects/images/',
  temsProviderBase: 'https://mock-api.test/providers/',
} as const;

/** Small helpers */
const resetService = () => {
  (StoreService as any).stores.clear();
  (StoreService as any).defaultStoreName = 'default';
};
const add = (name: string, cfg: any) => StoreService.addStore(name, cfg);
const get = (name?: string) => StoreService.getStore(name);
const cfg = (name?: string) => StoreService.getConfig(name);

describe('StoreService', () => {
  beforeEach(() => {
    resetService();
    cy.spy(console, 'warn'); // one global spy; assertions can check call args
  });

  describe('addStore', () => {
    it('adds a new store and makes it retrievable by name', () => {
      const store = add('test-store', LDP_CONFIG);
      expect(store).to.exist;
      expect(get('test-store')).to.equal(store);
    });

    it('trims the provided name', () => {
      const store = add('  test  ', LDP_CONFIG);
      expect(get('test')).to.equal(store);
      expect(get('  test  ')).to.equal(store);
    });

    it('throws when name is empty/whitespace', () => {
      expect(() => add('', LDP_CONFIG)).to.throw(
        '[StoreService] Store name cannot be empty.',
      );
      expect(() => add('   ', LDP_CONFIG)).to.throw(
        '[StoreService] Store name cannot be empty.',
      );
    });

    it('throws when config is missing', () => {
      expect(() => add('x', null as any)).to.throw(
        '[StoreService] Store configuration is required.',
      );
      expect(() => add('y', undefined as any)).to.throw(
        '[StoreService] Store configuration is required.',
      );
    });

    it('warns when overwriting an existing store', () => {
      add('dup', LDP_CONFIG);
      add('dup', FC_CONFIG_MIN);
      expect(console.warn).to.have.been.calledWith(
        '[StoreService] Store with name "dup" already exists. Overwriting.',
      );
    });

    it('delegates creation to StoreFactory.create with the given config', () => {
      const stub = cy
        .stub(StoreFactory, 'create')
        .callsFake((c: any) => ({ __mock: true, cfg: c }) as any);
      const store = add('delegation', LDP_CONFIG);
      expect(stub).to.have.been.calledOnceWith(LDP_CONFIG);
      expect((store as any).__mock).to.equal(true);
      stub.restore();
    });
  });

  describe('getStore', () => {
    it('returns store by name', () => {
      const store = add('named', LDP_CONFIG);
      expect(get('named')).to.equal(store);
    });

    it('returns default store when name is omitted and default exists', () => {
      StoreService.init(LDP_CONFIG);
      const def = get();
      expect(def).to.exist;
      expect(get('default')).to.equal(def);
    });

    it('creates fallback default store if none exists yet', () => {
      // explicitly verify fallback path
      expect(get('default')).to.exist;
      const again = get('default');
      expect(again).to.exist; // idempotent
    });

    it('returns null for a missing named store and warns', () => {
      const result = get('missing-one');
      expect(result).to.be.null;
      expect(console.warn).to.have.been.calledWith(
        '[StoreService] Store with name "missing-one" not found.',
      );
    });

    it('handles whitespace in name (trim) and falls back to default for empty string', () => {
      add('trimme', LDP_CONFIG);
      expect(get('  trimme  ')).to.exist;

      // empty -> default (created by fallback)
      expect(get('')).to.exist;
    });
  });

  describe('setDefaultStore', () => {
    it('sets a new default store', () => {
      const s = add('new-default', LDP_CONFIG);
      StoreService.setDefaultStore('new-default');
      expect(get()).to.equal(s);
    });

    it('throws for non-existent name', () => {
      expect(() => StoreService.setDefaultStore('nope')).to.throw(
        '[StoreService] Store with name "nope" not found.',
      );
    });

    it('throws for empty/whitespace name', () => {
      expect(() => StoreService.setDefaultStore('')).to.throw(
        '[StoreService] Store name cannot be empty.',
      );
      expect(() => StoreService.setDefaultStore('   ')).to.throw(
        '[StoreService] Store name cannot be empty.',
      );
    });
  });

  describe('init', () => {
    it('initializes with default LDP config when none provided', () => {
      StoreService.init();
      expect(get('default')).to.exist;
      expect(cfg('default')?.type).to.equal(StoreType.LDP);
    });

    it('initializes with a custom config', () => {
      StoreService.init(FC_CONFIG_MIN as any);
      expect(cfg('default')).to.deep.equal(FC_CONFIG_MIN);
    });
  });

  describe('getInstance (backward compatibility)', () => {
    it('returns the current default store instance', () => {
      StoreService.init();
      const inst = StoreService.getInstance();
      expect(inst).to.equal(get('default'));
    });

    it('throws if the default store cannot be obtained/created', () => {
      const backup = StoreService.getStore;
      cy.stub(StoreService, 'getStore').returns(null);
      expect(() => StoreService.getInstance()).to.throw(
        '[StoreService] Failed to get or create default store instance.',
      );
      (StoreService.getStore as any).restore?.();
      StoreService.getStore = backup;
    });
  });

  describe('getConfig', () => {
    it('returns the config for a named store', () => {
      add('cfg', { ...LDP_CONFIG, endpoint: 'http://t' });
      expect(cfg('cfg')).to.deep.equal({ ...LDP_CONFIG, endpoint: 'http://t' });
    });

    it('returns default config when name is omitted', () => {
      StoreService.init(LDP_CONFIG);
      expect(cfg()).to.deep.equal(LDP_CONFIG);
    });

    it('returns null for a missing store', () => {
      expect(cfg('ghost')).to.be.null;
    });

    it('trims the name when fetching config', () => {
      add('trimc', LDP_CONFIG);
      expect(cfg('  trimc  ')).to.deep.equal(LDP_CONFIG);
    });
  });

  describe('integration / behavior', () => {
    it('supports multiple stores with different configs', () => {
      const ldp = add('ldp', LDP_CONFIG);
      const fc = add('fc', FC_CONFIG_MIN);

      expect(get('ldp')).to.equal(ldp);
      expect(get('fc')).to.equal(fc);
      expect(ldp).to.not.equal(fc);
    });

    it('keeps the default store after adding custom ones', () => {
      StoreService.init(); // default = LDP
      const def = get();

      add('custom', FC_CONFIG_MIN);
      expect(get()).to.equal(def);
      expect(get('custom')).to.not.equal(def);
    });

    it('changing default store updates what getStore() returns', () => {
      const s1 = add('s1', LDP_CONFIG);
      const s2 = add('s2', FC_CONFIG_MIN);

      StoreService.setDefaultStore('s1');
      expect(get()).to.equal(s1);

      StoreService.setDefaultStore('s2');
      expect(get()).to.equal(s2);
    });

    it('fallbackInitIfNeeded creates a default LDP store when nothing exists (direct call)', () => {
      resetService();
      const created = (StoreService as any).fallbackInitIfNeeded();
      expect(created).to.exist;
      expect(cfg('default')?.type).to.equal(StoreType.LDP);
    });
  });
});
