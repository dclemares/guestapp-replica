/* Hand-maintained on top of documents.js (which is generated): older models of a document whose reading lines are on another side,
   and residence permits that foreign guests can use in the property's country. Loaded after documents.js and layouts.js. */
(function(){
  const FRONT_MRZ_IMAGE='assets/catalog/generic-id-front-mrz.webp';
  const GENERIC_NOTE='Illustrative example: we do not have an image of this model and yours may look different. Look for the lines of letters, numbers and “<”.';
  const OWN_CREDIT='Demo drawn from the PRADO reference · fictitious data · NOT VALID · DEMO';
  const GENERIC_CREDIT='Generic catalog example · not your country’s design · fictitious data';
  const sample=nationality=>({firstName:'ALEX',surname:'DEMO SAMPLE',nationality,birthDate:'1985-03-14',documentNumber:'DEMO12345',expiryDate:'2031-01-01'});

  if(typeof documentLayouts!=='undefined')Object.assign(documentLayouts,{
    'generic-id-front-mrz':[['photo',3.5,19,33,52],['text',39,24,25,12,2],['text',39,49,20,12,2],['text',58,49,20,12,2],['text',76,9,20,6,1],['mrz',4,73,92,24,2]],
    'FR-id-paper-front':[['text',3,14,52,4,1],['photo',2.8,19,26.2,52.8],['text',33,19,55,33,5],['sign',48,59,28,8],['mrz',5.8,75.1,86.2,16.1,2]],
    'ES-tie-back':[['photo',7.5,10,10.5,21],['text',23,16,48,17,4],['text',6,33,30,20,4],['mrz',5.4,66.7,90,23.4,3]],
    'CO-cedula-back':[['barcode',12,3.5,83.3,30.1],['text',12.6,37,57,18,4],['mrz',4.5,64.7,90.7,26.1,3]],
    'BH-id-back':[['photo',10.5,12.5,10,14],['text',54,12,40,55,8],['mrz',5.5,74,87,22,3]],
    'US-dl-back':[['barcode',29,1,58,8],['barcode',34,11,53,31.5],['text',4,6,17,16,3],['text',4,50,40,10,3]],
    'RO-id-classic-front':[['text',29,12,40,8,2],['photo',2,12,25.8,50.4],['text',29,21,25,50,7],['ghost',82.5,18,14,23],['mrz',3.9,75.3,90,14.6,2]],
  });

  // Older model with the reading lines on the front (two lines of 36 characters, below the photo)
  const frontMrzModel=(code,label,hint,source='',own=null)=>{
    const country=documentCatalog[code].name;
    return {label,hint,formType:'id',side:'front',sideLabel:'Front · photo side',title:'Photograph the photo side of your ID card',
      instruction:'On this model the reading lines are on the front, below the photo. The back isn\'t needed.',
      image:own?.image||FRONT_MRZ_IMAGE,alt:`Example of an older ID card from ${country}, front`,mrz:own?.mrz||[4,73,92,24],approx:true,lines:2,source,
      credit:own?OWN_CREDIT:GENERIC_CREDIT,sample:sample(country),generic:!own,generated:own?'drawn':'template',note:own?undefined:GENERIC_NOTE};
  };
  const models={
    // PRADO FRA-BO-03001 (since 2021, lines on the back) and FRA-BO-02001/02002 (laminated, 1988-2021, lines on the front)
    FR:{id:{label:'ID card · since 2021',hint:'Bank-card size. Lines on the back.'},
        'id-paper':frontMrzModel('FR','ID card · before 2021','Laminated paper card. Lines on the front.',
          'https://www.consilium.europa.eu/prado/en/prado-documents/FRA/B/docs-per-category.html',
          {image:'assets/catalog/FR-id-paper-front.webp',mrz:[5.8,75.1,86.2,16.1]})},
    // PRADO ROU-BO-05001/05002/06001 (since 2021, with or without chip) and ROU-BO-01002 to 04001 (classic, 2001-2021, blank back)
    RO:{id:{label:'ID card · since 2021',hint:'Bank-card size with the flag. Lines on the back.'},
        'id-classic':frontMrzModel('RO','ID card · before 2021','Classic card. Lines on the front, under the photo.',
          'https://www.consilium.europa.eu/prado/en/prado-documents/ROU/B/docs-per-category.html',
          {image:'assets/catalog/RO-id-classic-front.webp',mrz:[3.9,75.3,90,14.6]})},
    AE:{id:{label:'Emirates ID'}},
    KH:{id:{side:'back',sideLabel:'Back · reverse side',title:'Photograph the back of your ID document',
        instruction:'Turn it over. The reading lines are usually at the bottom of the back.',
        image:'assets/catalog/generic-id-back.webp',imageOther:'assets/catalog/generic-id-front.webp',alt:'Example ID document from Cambodia, back'}},
  };
  for(const [code,docs] of Object.entries(models)){
    const target=documentCatalog[code]?.documents;if(!target)continue;
    const ordered={};
    for(const [key,doc] of Object.entries(docs)){ordered[key]=target[key]?{...target[key],...doc}:doc;}
    for(const [key,doc] of Object.entries(target))if(!ordered[key])ordered[key]=doc;
    documentCatalog[code].documents=ordered;
  }

  // Residence permits: issued by the property's country to foreign residents. Same card format as an ID (lines on the back).
  const EU_PERMIT='Residence permit';
  const permitLabels={ES:['Residence card (TIE)','Foreigner identity card (TIE) with your NIE. Lines on the back.'],
    AE:['Emirates ID (resident)','The ID card for UAE residents.'],
    CO:['Foreigner ID card (Cédula)','Colombian Cédula de extranjería, the ID card for foreign residents. Lines on the back.']};
  // Only permits that are in the backend's document list for foreign guests (ES_SPANISH_RESIDENCE, CO_RESIDENCE_PERMIT,
  // AE_UAE_RESIDENCE) and that we checked against PRADO and drew; everywhere else the guest gets their ID and passport
  const permitCountries=['AE','CO','ES'];
  const freeMovement=new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','CH']);   // EU, EEA and Switzerland: their citizens register without a residence card
  // PRADO ESP-HO-03001 (2020); the 2003 and 2011 models (ESP-HO-02001 to 02005) also have the three lines on the back
  const ownPermits={ES:{image:'assets/catalog/ES-tie-back.webp',imageOther:'assets/catalog/ES-tie-front.webp',mrz:[5.4,66.7,90,23.4],
    source:'https://www.consilium.europa.eu/prado/en/prado-documents/ESP/H/docs-per-category.html',credit:OWN_CREDIT},
    // PRADO COL-HO-01001: barcode on top of the back, three lines below it (backend CO_RESIDENCE_PERMIT)
    CO:{image:'assets/catalog/CO-cedula-back.webp',imageOther:'assets/catalog/CO-cedula-front.webp',mrz:[4.5,64.7,90.7,26.1],
    source:'https://www.consilium.europa.eu/prado/en/prado-documents/COL/H/docs-per-category.html',credit:OWN_CREDIT}};
  const residencePermit=(code,nationality)=>{
    const c=documentCatalog[code];if(!c||!permitCountries.includes(code))return null;
    if(freeMovement.has(code)&&freeMovement.has(nationality))return null;
    const [label,hint=`Issued by ${c.name} to foreign residents. Lines on the back.`]=permitLabels[code]||[EU_PERMIT];
    const own=code==='AE'?c.documents.id:ownPermits[code];   // the Emirates ID is the same card for citizens and residents
    return {label,hint,formType:'id',side:'back',sideLabel:'Back · reverse side',title:'Photograph the back of your residence card',
      instruction:'Turn it over. The reading lines are at the bottom of the back.',
      image:own?own.image:'assets/catalog/generic-id-back.webp',imageOther:own?own.imageOther:'assets/catalog/generic-id-front.webp',
      alt:`Example residence card from ${c.name}, back`,mrz:own?.mrz||[4,62,92,28],approx:true,lines:3,source:own?own.source:'',
      credit:own?own.credit:GENERIC_CREDIT,sample:sample(c.name),generic:!own,generated:ownPermits[code]?'drawn':undefined,note:own?undefined:GENERIC_NOTE,issuer:code};
  };

  // Gulf ID cards accepted at UAE properties (backend AE_ID_GCC). Only Bahrain's has reading lines in PRADO (BHR-BO-01001,
  // three lines on the back); Oman's and Qatar's have none and Kuwait's and Saudi Arabia's aren't in PRADO.
  const gccIds={BH:{label:'ID card',hint:'Bahraini identity card, accepted for stays in the UAE. Lines on the back.',formType:'id',side:'back',sideLabel:'Back · reverse side',
    title:'Photograph the back of your ID card',instruction:'Turn it over. The reading lines are at the bottom of the back.',
    image:'assets/catalog/BH-id-back.webp',imageOther:'assets/catalog/BH-id-front.webp',alt:'Example ID card from Bahrain, back',mrz:[5.5,74,87,22],approx:true,lines:3,
    source:'https://www.consilium.europa.eu/prado/en/prado-documents/BHR/B/docs-per-category.html',credit:OWN_CREDIT,sample:sample('Bahrain'),generic:false,generated:'drawn'}};

  // Extra documents the backend offers to every guest at a property in these countries:
  // US_DL / CA_DL (a US or Canadian driving licence, read from the barcode on the back) and AT_OTHER / PT_OTHER ("Other document")
  const drivingLicence={label:'Driving licence (US or Canada)',hint:'US or Canadian driving licence. We read the barcode on the back.',formType:'id',code:'barcode',
    side:'back',sideLabel:'Back · reverse side',title:'Photograph the back of your driving licence',instruction:'Turn it over. We read the large barcode on the back.',
    image:'assets/catalog/US-dl-back.webp',imageOther:'assets/catalog/US-dl-front.webp',alt:'Example US driving licence, back',mrz:[34,11,53,32],approx:true,lines:0,
    credit:'Example of a California driving licence · your state’s design may differ · fictitious data',sample:sample('United States'),generic:true,generated:'drawn',
    note:'Illustrative example: every state and province has its own design. Look for the large barcode on the back.'};
  const otherDocument={label:'Other document',hint:'Another official document with reading lines, such as a residence card. Photograph the side with the lines.',
    formType:'id',side:'back',sideLabel:'Side with the lines',title:'Photograph the side with the reading lines',
    instruction:'Turn the document so the two or three lines of letters, numbers and “<” are in view.',
    image:'assets/catalog/generic-id-back.webp',imageOther:'assets/catalog/generic-id-front.webp',alt:'Example of a document with reading lines',mrz:[4,62,92,28],approx:true,lines:3,
    credit:GENERIC_CREDIT,generic:true,note:GENERIC_NOTE};
  const propertyExtras={US:[['dl-US',drivingLicence]],CA:[['dl-CA',drivingLicence]],AT:[['other-AT',otherDocument]],PT:[['other-PT',otherDocument]]};

  // Documents the guest can choose from: their nationality's own, plus what the property country adds (residence permit, extras)
  function documentsFor(nationality,propertyCountry){
    const own=Object.entries(documentCatalog[nationality]?.documents||{}).map(([key,doc])=>[key,{...doc,issuer:nationality}]);
    if(propertyCountry==='AE'&&gccIds[nationality]&&!own.some(([key])=>key==='id'))own.unshift(['id',{...gccIds[nationality],issuer:nationality}]);
    const permit=nationality&&propertyCountry&&propertyCountry!==nationality?residencePermit(propertyCountry,nationality):null;
    const extras=nationality?(propertyExtras[propertyCountry]||[]).map(([key,doc])=>[key,{...doc,sample:doc.sample||sample(documentCatalog[nationality]?.name||''),issuer:doc.code==='barcode'?propertyCountry:nationality}]):[];
    return [...own,...(permit?[[`permit-${propertyCountry}`,permit]]:[]),...extras];
  }
  window.documentsFor=documentsFor;
  window.resolveDocument=(nationality,key,propertyCountry)=>documentsFor(nationality,propertyCountry).find(([k])=>k===key)?.[1]??null;
})();
