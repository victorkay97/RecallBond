import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base=process.env.RECALLBOND_PREVIEW_URL || 'http://127.0.0.1:4173';
await mkdir('screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
const checkErrors=page=>page.on('pageerror',e=>errors.push(e.message));
const assertNoHorizontalOverflow=async (page,label)=>{
 const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(metrics.scrollWidth<=metrics.viewport+2,label+' should not overflow horizontally: '+JSON.stringify(metrics));
};
try {
  const mobile=await browser.newContext({
    ...devices['Pixel 7'], viewport:{width:390,height:844},
    reducedMotion:'reduce',locale:'en-US'
  });
  const page=await mobile.newPage();checkErrors(page);
  await page.goto(base+'/app/',{waitUntil:'domcontentloaded'});
  await page.locator('.qr-container svg').first().waitFor({timeout:16000});
  await page.locator('.near-emblem').first().waitFor({timeout:10000});
  const assets=await page.evaluate(()=>{
    const art=[...document.querySelectorAll('.near-emblem')];
    const icons=[...document.querySelectorAll('use[href*="mingcute.svg"]')];
    return {artCount:art.length,allImagesLoaded:art.every(x=>x.complete&&x.naturalWidth>0),
      iconCount:icons.length,font:getComputedStyle(document.body).fontFamily,
      whitePrimary:getComputedStyle(document.querySelector('.btn.primary')).color};
  });
  assert.equal(assets.artCount,3,'three passport faces should display NEAR artwork');
  assert.ok(assets.allImagesLoaded,'NEAR artwork must resolve on mobile');
  assert.ok(assets.iconCount>=10,'MingCute icon references must be in the app');
  assert.match(assets.font,/Manrope/i,'updated wallet typography should be applied');
  assert.equal(assets.whitePrimary,'rgb(255, 255, 255)','primary button text/icons must be white');

  assert.equal(await page.locator('[data-qr] svg').count(),3,'all passports should have locally generated QR SVGs');
  assert.equal(await page.locator('.floating-tabbar').evaluate(e=>getComputedStyle(e).display),'flex','mobile bottom tabs must be visible');
  await assertNoHorizontalOverflow(page,'consumer home');
  await page.screenshot({path:'screenshots/consumer-mobile-home.png',fullPage:true});
  const card=page.locator('#screen-home .passport-button');
  await card.click();
  assert.ok((await card.getAttribute('class')).includes('is-flipped'),'passport flip should update card state');
  assert.equal(await card.getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'screenshots/consumer-mobile-qr.png',fullPage:true});
  await page.locator('.floating-tabbar [data-go="collection"]').click();
  assert.equal(await page.locator('#screen-collection').isVisible(),true);
  await assertNoHorizontalOverflow(page,'consumer collection');
  await page.screenshot({path:'screenshots/consumer-mobile-collection.png',fullPage:true});
  await page.locator('#screen-collection [data-modal="transfer"]').click();
  assert.equal(await page.getByRole('dialog').isVisible(),true,'transfer should open sheet');
  await page.locator('#recipient').fill('emmanuel.testnet');
  await page.locator('#transfer-form button[type="submit"]').click();
  assert.equal(await page.locator('#dialog-layer').isVisible(),false,'preview sheet should close');
  // Consumer-initiated defect report, persisted only to this browser's demo storage.
  await page.locator('#open-defect-report').click();
  assert.equal(await page.locator('.claims-dialog').isVisible(),true);
  await page.locator('#claim-category').selectOption('display');
  await page.locator('#claim-description').fill('A green vertical line appeared on the display during normal use.');
  await page.locator('.claims-dialog button[type="submit"]').click();
  assert.equal(await page.locator('.claim-case').count(),1,'consumer should see the reported demo defect');
  assert.match(await page.locator('#consumer-claims').innerText(),/Submitted/);
  await page.screenshot({path:'screenshots/consumer-mobile-defect-report.png',fullPage:true});

  await page.locator('.floating-tabbar [data-go="wallet"]').click();
  await page.screenshot({path:'screenshots/consumer-mobile-wallet.png',fullPage:true});
  await page.locator('.floating-tabbar [data-go="home"]').click();
  await page.locator('#screen-home [data-open="claim"]').click();
  await page.locator('#simulate-claim').click();
  assert.equal(await page.locator('#stat-credit').innerText(),'100','claim mock should credit simulated contract, not wallet');
  await page.locator('.floating-tabbar [data-go="wallet"]').click();
  assert.match(await page.locator('#wallet-credit').innerText(),/100/);
  console.log('PASS: mobile navigation, QR flip, transfer sheet and simulated claim credit');
  const verifier=await mobile.newPage();checkErrors(verifier);
  await verifier.goto(base+'/verify/?id=RB-NV-002891',{waitUntil:'domcontentloaded'});
  assert.equal(await verifier.locator('#verification-result').isVisible(),true);
  assert.match(await verifier.locator('#verification-result').innerText(),/Registered · Hidden/);
  assert.ok(!(await verifier.locator('#verification-result').innerText()).includes('tomi.testnet'));
  await assertNoHorizontalOverflow(verifier,'public verifier');
  await verifier.screenshot({path:'screenshots/verify-mobile.png',fullPage:true});
  await verifier.locator('[data-sample="RB-NV-002892"]').click();
  assert.match(await verifier.locator('#product-name').innerText(),/NovaPhone S2/);
  console.log('PASS: public verification works without login and hides owner identity');
  // Optional live-testnet panel uses a mocked public RPC response in CI.
  await verifier.route('https://test.rpc.fastnear.com/', async route => {
    const data={token_id:'RB-NV-002891',manufacturer:'fictional-issuer.testnet',
      batch_id:'BATTERY-X21',owner_id:'private-owner.testnet',serial_commitment:'not-for-public-display'};
    await route.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:'recallbond-verify',
        result:{result:Array.from(new TextEncoder().encode(JSON.stringify(data))),block_height:987654}})});
  });
  assert.equal(await verifier.locator('#testnet-contract').inputValue(),'rb-vk97-261112.testnet');
  assert.equal(await verifier.locator('#testnet-token').inputValue(),'RB-NV-002891');
  await verifier.locator('#testnet-contract').fill('recallbond.testnet');
  await verifier.locator('#testnet-token').fill('RB-NV-002891');
  await verifier.locator('#testnet-submit').click();
  await verifier.locator('#testnet-result h3').waitFor({timeout:8000});
  const onchainText=await verifier.locator('#testnet-result').innerText();
  assert.match(onchainText,/Public onchain record found/);
  assert.match(onchainText,/fictional-issuer.testnet/);
  assert.ok(!onchainText.includes('private-owner.testnet'),'public UI must hide the owner account');
  assert.ok(!onchainText.includes('not-for-public-display'),'public UI must hide serial commitment');
  await verifier.screenshot({path:'screenshots/verify-mobile-testnet-query.png',fullPage:true});
  console.log('PASS: optional NEAR testnet read-only view with mocked RPC; sensitive fields hidden');

  const business=await mobile.newPage();checkErrors(business);
  await business.goto(base+'/business/',{waitUntil:'domcontentloaded'});
  console.log('BUSINESS_INITIAL_GEOMETRY', await business.evaluate(()=>{
    const viewport={innerWidth,innerHeight,visualWidth:visualViewport?.width,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,meta:document.querySelector('meta[name="viewport"]')?.content};
    const offenders=[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,70),rect:e.getBoundingClientRect()})).filter(x=>x.rect.width>0&&x.rect.right>innerWidth+8&&x.rect.left<innerWidth).slice(0,25).map(x=>({...x,rect:{left:x.rect.left,right:x.rect.right,width:x.rect.width}}));
    return {viewport,offenders};
  }));
  await business.locator('.floating-tabbar [data-go="claims"]').click();
  assert.equal(await business.locator('#b-claims').isVisible(),true);
  assert.equal(await business.locator('#business-claims .claim-case').count(),1,'manufacturer should find the same browser-only case');
  await business.locator('#business-claims .claim-case button').click();
  await business.locator('#claim-decision').selectOption('under_review');
  await business.locator('#claim-note').fill('Fictional reviewer began inspecting the report.');
  // Diagnostic screenshot / geometry ensures modal controls are truly tappable on a phone.
  await business.screenshot({path:'screenshots/business-mobile-claim-modal.png',fullPage:true});
  console.log('REVIEW_DIALOG_GEOMETRY',await business.evaluate(()=>{
    const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,position:getComputedStyle(e).position,z:getComputedStyle(e).zIndex}};
    return {layer:rect('#claim-dialog-layer'),modal:rect('.claims-dialog'),submit:rect('.claims-dialog button[type="submit"]'),viewport:{width:innerWidth,height:innerHeight}}
  }));
  await business.locator('.claims-dialog button[type="submit"]').click();
  await business.screenshot({path:'screenshots/business-mobile-claims.png',fullPage:true});
  await business.locator('#business-claims .claim-case button').click();
  await business.locator('#claim-decision').selectOption('replacement_approved');
  await business.locator('#claim-note').fill('Fictional replacement recorded for demonstration only.');
  await business.locator('.claims-dialog button[type="submit"]').click();
  assert.match(await business.locator('#business-claims').innerText(),/Replacement approved/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.floating-tabbar [data-go="collection"]').click();
  assert.match(await page.locator('#consumer-claims').innerText(),/Replacement approved/,'consumer should see fictional manufacturer outcome');
  console.log('PASS: report to manufacturer review to consumer status, with no payout');

  assert.equal(await business.locator('.floating-tabbar').evaluate(e=>getComputedStyle(e).display),'flex');
  await business.locator('.floating-tabbar [data-go="recalls"]').click();
  assert.equal(await business.locator('#b-recalls').isVisible(),true);
  await assertNoHorizontalOverflow(business,'manufacturer studio');
  await business.screenshot({path:'screenshots/business-mobile.png',fullPage:true});
  await business.locator('#b-recalls [data-dialog="campaign"]').last().click();
  assert.equal(await business.getByRole('dialog').isVisible(),true);
  await business.locator('#payout').fill('100');
  await business.locator('#studio-form button[type="submit"]').click();
  assert.equal(await business.locator('#modal-layer').isVisible(),false);
  console.log('PASS: business mobile tabs and campaign dialog');
  await mobile.close();
  const desktop=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  const d=await desktop.newPage();checkErrors(d);
  await d.goto(base+'/app/',{waitUntil:'domcontentloaded'});
  assert.equal(await d.locator('.floating-tabbar').evaluate(e=>getComputedStyle(e).display),'none');
  assert.equal(await d.locator('.topnav').isVisible(),true);
  await d.screenshot({path:'screenshots/consumer-desktop-home.png',fullPage:true});
  await d.locator('.topnav [data-go="collection"]').click();
  await d.screenshot({path:'screenshots/consumer-desktop-collection.png',fullPage:true});
  await desktop.close();
  assert.deepEqual(errors,[],'Browser console must not contain uncaught page errors');
  console.log('PASS: desktop expanded layout; no browser JS errors');
  console.log('PREVIEW UI E2E PASS');
} finally {await browser.close();}
