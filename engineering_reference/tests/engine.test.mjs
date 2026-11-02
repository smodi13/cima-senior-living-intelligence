import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {computeDeal,computeAll,sensitivityTX,excelPMT,validateInput} from '../engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../model-data.json',import.meta.url)));
const baseline=JSON.parse(fs.readFileSync(new URL('./excel-baseline.json',import.meta.url)));
const summaryHeaders=baseline.summary[0];const forecastHeaders=baseline.forecast[0];
const outputs=computeAll(data);
function close(a,b,msg,tol=1e-7){assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${msg}: app=${a}, excel=${b}`)}
const summaryMap={'Units':'units','Price / unit':'pricePerUnit','Acquisition $':'acquisition','Closing costs':'closing','Upfront capex':'upfrontCapex','Initial debt':'loan','Financing fee':'financingFee','Initial equity':'equity','Exit cap':'exitCap','Exit value':'exitValue','Debt payoff':'loanPayoff','Net operating equity CF':'operatingEquityCF','Levered IRR':'leveredIRR','Equity MOIC':'moic','MAX BID price':'maxBid','MAX BID / unit':'maxBidPerUnit','Headroom vs price':'headroom','Year 1 NOI':'year1NOI','Year 5 NOI':'year5NOI','Min DSCR':'minDSCR','Debt / Year 5 NOI':'debtToNOI'};
for(let i=1;i<baseline.summary.length;i++){
 const row=baseline.summary[i],key=row[0],result=outputs[key];
 test(`${key} matches 21 Excel dashboard fields`,()=>{for(let j=1;j<row.length;j++){const name=summaryHeaders[j],k=summaryMap[name];if(row[j]==='NM'){assert.equal(result[k],null)}else close(result[k],row[j],`${key} ${name}`)}});
}
const fMap={
 'Year':'year','Occupancy':'occupancy','Occupied units':'occupiedUnits','Rent / mo':'rent','Ancillary / mo':'ancillary','Revenue / yr':'revenue','Fixed labor':'fixedLabor','Variable labor':'variableLabor','Fixed nonlabor':'fixedNonlabor','Other variable cost':'variableOther','Tax + insurance':'taxInsurance','Management fee':'managementFee','Total opex':'operatingExpenses','NOI':'noi','Capex reserve':'capexReserve','CF before debt':'beforeDebt','Opening loan':'openingLoan','Interest':'interest','Principal':'principal','Debt service':'debtService','Closing loan':'closingLoan','DSCR':'dscr','Operating equity CF':'operatingEquityCF','Gross sale':'grossSale','Sale fees':'saleFees','Loan payoff':'loanPayoff','Total equity CF':'equityCashFlow','PV before debt':'pvBeforeDebt','PV debt service':'pvDebtService','PV sale':'pvSale'};
let caseKey='';let yearIndex=0;
for(let i=1;i<baseline.forecast.length;i++){const row=baseline.forecast[i];if(row[0]){caseKey=row[0];yearIndex=0}if(!row[1])continue;const key=caseKey,yi=yearIndex++;
 test(`${key} Year ${yi+1} matches 30 Excel forecast fields`,()=>{for(let j=1;j<row.length;j++){const name=forecastHeaders[j];close(outputs[key].forecast[yi][fMap[name]],row[j],`${key} Y${yi+1} ${name}`)}})
}
test('Model change propagates across financing, exit and IRR',()=>{const updated=structuredClone(data);updated.inputs.TX['24']=140000;const a=computeDeal(data.inputs.TX,data.scenario.Base),b=computeDeal(updated.inputs.TX,updated.scenario.Base);assert.ok(b.acquisition>a.acquisition);assert.ok(b.loan>a.loan);assert.ok(b.equity>a.equity);assert.ok(b.leveredIRR<a.leveredIRR)})
test('Scenario direction follows downside/base/upside',()=>{for(const d of ['TX','Katy'])assert.ok(outputs[`${d} Down`].leveredIRR<outputs[`${d} Base`].leveredIRR && outputs[`${d} Base`].leveredIRR<outputs[`${d} Up`].leveredIRR)})
test('Scenario transformations are pure',()=>{const before=JSON.stringify(data);const t=sensitivityTX(data);assert.equal(t.rows.length,7);assert.equal(JSON.stringify(data),before)})
test('Input validation accepts simple sane assumptions',()=>{assert.equal(validateInput(24,135000),true);assert.equal(validateInput(33,.08),true);assert.equal(validateInput(33,-.01),false);assert.equal(validateInput(8,1.7),false)});
