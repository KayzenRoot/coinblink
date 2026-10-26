// Browser proof of production denial, and LOCAL-only synthetic passkey preview.
import { test, expect } from '@playwright/test';
test('P1 Owner: deployed /admin is still unreachable, even with forged Owner headers',async({request})=>{
  for(const path of ['/admin','/admin/login','/admin/workspace']){
    const response=await request.get(path,{headers:{'x-owner-role':'owner',cookie:'__Host-cb_p1_owner='+'aa'.repeat(32)}});
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('CMS_TEST_HMAC_KEY');
  }
});
