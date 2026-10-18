import {test,expect} from '@playwright/test';
test('onboarding, conservative movement restrictions, journal persistence and demo labeling',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByPlaceholder('Your name').fill('Chinnu');await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByLabel('Injury or pain').check();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Find my flow'}).click();
 await expect(page.getByRole('heading',{name:'Your pace. Your progress.'})).toBeVisible();
 await page.locator('.bottom-nav').getByRole('button',{name:'Train',exact:true}).click();await expect(page.getByRole('button',{name:'Unavailable in conservative mode'}).first()).toBeDisabled();
 await page.locator('.bottom-nav').getByRole('button',{name:'Journal',exact:true}).click();await page.getByPlaceholder('What did you notice today?').fill('An easier day.');await page.getByRole('button',{name:'Save check-in'}).click();await expect(page.getByText('Check-in saved locally.')).toBeVisible();
 await page.reload();await page.locator('.bottom-nav').getByRole('button',{name:'Journal',exact:true}).click();await expect(page.getByText('An easier day.')).toBeVisible();
 await page.locator('.bottom-nav').getByRole('button',{name:'Progress',exact:true}).click();await page.getByRole('button',{name:'Load labeled demo history'}).click();await expect(page.locator('.history-row')).toHaveCount(7);await expect(page.locator('.history-row').first().getByText('DEMO')).toBeVisible();expect(errors).toEqual([]);
});
test('trainer opens without automatically enabling cloud microphone',async({page})=>{
 await page.goto('/');await page.getByPlaceholder('Your name').fill('Test');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Find my flow'}).click();
  await page.getByRole('button',{name:'Start a session'}).click();await expect(page.getByRole('heading',{name:'Squat',exact:true})).toBeVisible();await expect(page.getByText('Automatic spoken coaching on')).toBeVisible();await expect(page.getByRole('button',{name:'Toggle automatic spoken coaching'})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Enable microphone'})).not.toBeVisible();
  await page.locator('.bottom-nav').getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Backend URL').fill('http://localhost:10000');await page.route('http://localhost:10000/health',route=>route.abort());await page.getByRole('button',{name:'Test backend',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'USB backend unreachable'})).toBeVisible();await expect(page.getByRole('button',{name:'Test spoken coaching'})).toBeVisible();
});
