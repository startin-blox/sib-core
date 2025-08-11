import type {
  DcatService,
  Destination,
  Source,
} from '../implemenations/federated-catalogue/interfaces.ts';

/**
 * 2. Revised mapping function:
 *    - If “dcat:service” exists, map from that directly.
 *    - Otherwise, if “dcat:dataset” exists, treat its first array element as the service block.
 *    - Use gax-core:operatedBy when dcat:service is present, and gax-core:offeredBy when dcat:dataset is used.
 */
export function mapSourceToDestination(
  src: Source,
  opts: {
    temsServiceBase: string; // e.g. "https://api.tems-stg.startinblox.com/services/"
    temsCategoryBase: string; // e.g. "https://api.tems-stg.startinblox.com/providers/categories/"
    temsImageBase: string; // e.g. "https://api.tems-stg.startinblox.com/objects/images/"
    temsProviderBase: string; // e.g. "https://api.tems-stg.startinblox.com/providers/"
  },
): Destination {
  const vc = src.verifiableCredential;
  const cs = vc.credentialSubject;

  // 1) Determine which key holds the service block
  let catInfo: DcatService;
  let usedKey: 'service' | 'dataset';
  let type: 'tems:Service' | 'tems:DataOffer';
  if (cs['dcat:service']) {
    catInfo = cs['dcat:service'];
    usedKey = 'service';
    type = 'tems:Service';
  } else if (cs['dcat:dataset'] && cs['dcat:dataset'].length > 0) {
    catInfo = cs['dcat:dataset'][0];
    usedKey = 'dataset';
    type = 'tems:DataOffer';
  } else {
    throw new Error(
      "Expected either credentialSubject['dcat:service'] or a non-empty array in ['dcat:dataset']",
    );
  }

  // 2) Build TEMS‐style @id from the Resource’s @id
  const resourceId = cs['@id'];
  const slug = resourceId.split('/').pop() || 'unknown';
  const serviceId = `${opts.temsServiceBase}${encodeURIComponent(slug)}/`;

  // 3) Map issuanceDate → creation_date; expirationDate → update_date
  const creation_date = vc.issuanceDate;
  const update_date = vc.expirationDate;

  // 4) Map dcterms:title + rdfs:comment → name + description
  const name = catInfo['dcterms:title'];
  const description = catInfo['rdfs:comment'];

  // 5) long_description ← join dcat:keyword into a single string
  const keywords = catInfo['dcat:keyword'] || [];
  const long_description =
    keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : '';

  // 6) Build categories container from keywords
  const categories = {
    '@id': `${serviceId}categories/`,
    '@type': 'ldp:Container' as const,
    'ldp:contains': keywords.map(kw => ({
      '@id': `${opts.temsCategoryBase}${encodeURIComponent(kw)}/`,
      '@type': 'tems:Category' as const,
      name: kw,
    })),
  };

  // 7) Determine activation_status / is_in_app / is_external / is_api
  const endpointURL = catInfo['dcat:endpointURL'] || '';
  const hasEndpoint = endpointURL.trim().length > 0;
  const activation_status = hasEndpoint;
  const is_in_app = hasEndpoint;
  const is_external = hasEndpoint;
  const is_api = hasEndpoint;

  // 8) Collect thumbnail URLs “as-is”
  const imageUrls: string[] = [];
  if (catInfo['foaf:thumbnail']?.['rdf:resource']) {
    imageUrls.push(catInfo['foaf:thumbnail']['rdf:resource']);
  }
  if (catInfo['dcterms:creator']?.['foaf:thumbnail']?.['rdf:resource']) {
    imageUrls.push(
      catInfo['dcterms:creator']['foaf:thumbnail']['rdf:resource'],
    );
  }
  const images = {
    '@id': `${serviceId}images/`,
    '@type': 'ldp:Container' as const,
    'ldp:contains': imageUrls.map(url => ({
      // Keep the URL exactly as-is
      '@id': `${opts.temsImageBase}${encodeURIComponent(
        url.split('/').pop() || '0',
      )}/`,
      url: url,
      iframe: false, // Assuming no iframes in this case
      name: url.split('/').pop() || 'image',
      '@type': 'tems:Image' as const,
    })),
  };

  // 9) contact_url ← dcat:endpointDescription; documentation_url ← same or “-”
  const contact_url = catInfo['dcat:endpointDescription'] || '';
  const documentation_url = contact_url || '';
  let service_url = catInfo['dcat:endpointURL'] || '';
  if (service_url.includes('demo.isan.org'))
    // Then cut the string at demo.isan.org
    service_url = new URL(service_url).origin;

  // 10) Map provider:
  //     - If we used “dcat:service”, pick gax-core:operatedBy
  //     - If we used “dcat:dataset”, pick gax-core:offeredBy
  let providerRef: string;
  if (usedKey === 'service') {
    providerRef = cs['gax-core:operatedBy']?.['@id'] || '';
  } else {
    providerRef = cs['gax-core:offeredBy']?.['@id'] || '';
  }
  const providerSlug =
    providerRef.split(':').pop() + String(Math.random()) || '0';
  const providerLogo =
    catInfo['dcterms:creator']?.['foaf:thumbnail']?.['rdf:resource'] || '';
  const provider = {
    '@id': `${opts.temsProviderBase}${encodeURIComponent(providerSlug)}/`,
    '@type': 'tems:Provider',
    name: catInfo['dcterms:creator']?.['foaf:name'] || '',
    image: {
      '@id': `${opts.temsImageBase}${encodeURIComponent(
        providerLogo.split('/').pop() || '0',
      )}/`,
      '@type': 'tems:Image',
      iframe: false, // Assuming no iframes in this case
      url: providerLogo,
      name: providerLogo.split('/').pop() || 'provider-logo',
    },
  };

  // 11) data_offers: leave empty for now
  const data_offers: any[] = [];

  // 12) Assemble the Destination object
  const dest: Destination = {
    '@id': serviceId,
    creation_date,
    update_date,
    name,
    description,
    long_description,
    categories,
    activation_status,
    activation_date: null,
    licence: null,
    is_in_app,
    is_external,
    is_api,
    images,
    release_date: null,
    last_update: null,
    developper: null,
    contact_url,
    documentation_url,
    url: service_url,
    provider,
    data_offers,
    '@type': type,
  };

  return dest;
}
