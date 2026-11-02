/* Cima independent research case, formula-equivalent port of the audited Excel model.
 * All financial outputs are computed. Source fact and analyst input values are in model-data.json.
 * Worksheet mapping: Inputs rows 6-40, Scenarios 6-13, Forecast columns B-AE,
 * Dashboard columns B-V, Returns columns B-G, Bid Sensitivity.
 */
export const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
export function excelPMT(rate,n,pv) {
  if (n<=0) throw new Error('Amortization years must be positive');
  return Math.abs(rate)<1e-12 ? -pv/n : -pv*rate/(1-Math.pow(1+rate,-n));
}
export function npv(rate,flows){return flows.reduce((s,c,i)=>s+c/Math.pow(1+rate,i),0)}
export function irr(flows){
  if (!flows.some(x=>x<0)||!flows.some(x=>x>0)) return null;
  let low=-.9999,high=1,lo=npv(low,flows),hi=npv(high,flows);
  while (lo*hi>0 && high<1048576){high=high*2+1;hi=npv(high,flows)}
  if (!Number.isFinite(lo)||!Number.isFinite(hi)||lo*hi>0) return null;
  for(let j=0;j<160;j++){const mid=(low+high)/2,v=npv(mid,flows);if(v*lo>0){low=mid;lo=v}else{high=mid;hi=v}}
  return (low+high)/2;
}
export function computeDeal(input,scenario) {
 const I=n=>Number(input[String(n)]),S=n=>Number(scenario[String(n)]);
 const units=I(7),pricePerUnit=I(24),acquisition=units*pricePerUnit;
 const closing=acquisition*I(25),upfrontCapex=units*I(26)*(1+S(13));
 const loan=acquisition*I(28),financingFee=loan*I(32), equity=acquisition+closing+upfrontCapex-loan+financingFee;
 const exitCap=I(33)+S(9);
 if (units<=0||exitCap<=0||I(35)!==5||I(36)<=-1||I(31)<=0||I(28)<0||I(28)>1 || I(10)+S(10)<1)throw new Error('Model constraints are out of range');
 const forecast=[];
 for(let y=1;y<=5;y++) {
  const occ=clamp(I(8)+(I(9)-I(8))*Math.min(1,(y-.5)*12/Math.max(1,I(10)+S(10)))+S(6),0,1);
  const occupied=units*occ;
  const rent=I(11)*Math.pow(1+I(12),y-1)*S(7);
  const ancillary=I(13)*Math.pow(1+I(14),y-1)*S(11);
  const revenue=occupied*(rent+ancillary)*12;
  const fixedLabor=units*I(15)*12*Math.pow(1+I(17),y-1)*S(8);
  const variableLabor=occupied*I(16)*12*Math.pow(1+I(17),y-1)*S(8);
  const fixedNonlabor=units*I(18)*12*Math.pow(1+I(20),y-1)*S(12);
  const variableOther=revenue*I(19)*S(12);
  const taxInsurance=units*I(21)*12*Math.pow(1+I(22),y-1);
  const managementFee=revenue*I(23);
  const operatingExpenses=fixedLabor+variableLabor+fixedNonlabor+variableOther+taxInsurance+managementFee;
  const noi=revenue-operatingExpenses;
  const capexReserve=units*I(27)*Math.pow(1+I(20),y-1);
  const beforeDebt=noi-capexReserve;
  const openingLoan=y===1?loan:forecast[y-2].closingLoan;
  const interest=openingLoan*I(29);
  const principal=y<=I(30)?0:Math.min(openingLoan,Math.max(0,-excelPMT(I(29),I(31),loan)-interest));
  const debtService=interest+principal;
  const closingLoan=openingLoan-principal;
  const dscr=debtService===0?0:noi/debtService;
  const operatingEquityCF=beforeDebt-debtService;
  const grossSale=y===I(35)?noi/exitCap:0;
  const saleFees=-grossSale*I(34);
  const loanPayoff=y===I(35)?-closingLoan:0;
  const equityCashFlow=operatingEquityCF+grossSale+saleFees+loanPayoff;
  const pvBeforeDebt=beforeDebt/Math.pow(1+I(36),y);
  const pvDebtService=debtService/Math.pow(1+I(36),y);
  const pvSale=(grossSale+saleFees)/Math.pow(1+I(36),y);
  forecast.push({year:y,occupancy:occ,occupiedUnits:occupied,rent,ancillary,revenue,fixedLabor,variableLabor,fixedNonlabor,variableOther,taxInsurance,managementFee,operatingExpenses,noi,capexReserve,beforeDebt,openingLoan,interest,principal,debtService,closingLoan,dscr,operatingEquityCF,grossSale,saleFees,loanPayoff,equityCashFlow,pvBeforeDebt,pvDebtService,pvSale});
 }
 const cashflows=[-equity,...forecast.map(f=>f.equityCashFlow)];
 const leveredIRR=irr(cashflows);
 const invested=-cashflows[0]-cashflows.slice(1).filter(n=>n<0).reduce((a,b)=>a+b,0);
 const distributed=cashflows.slice(1).filter(n=>n>0).reduce((a,b)=>a+b,0);
 const moic=invested?distributed/invested:0;
 const year5=forecast[4];
 const maxBidNumerator=forecast.reduce((s,f)=>s+f.pvBeforeDebt+f.pvSale,0)-upfrontCapex;
 const maxBidDenominator=(1+I(25)-I(28)+I(28)*I(32))+(I(28)/loan)*(forecast.reduce((s,f)=>s+f.pvDebtService,0)+(-year5.loanPayoff)/Math.pow(1+I(36),I(35)));
 const maxBid=Number.isFinite(maxBidNumerator/maxBidDenominator)?maxBidNumerator/maxBidDenominator:0;
 return {units,pricePerUnit,acquisition,closing,upfrontCapex,loan,financingFee,equity,exitCap,forecast,year1NOI:forecast[0].noi,year5NOI:year5.noi,exitValue:year5.grossSale,loanPayoff:-year5.loanPayoff,operatingEquityCF:forecast.reduce((s,f)=>s+f.operatingEquityCF,0),leveredIRR,moic,maxBid,maxBidPerUnit:maxBid/units,headroom:maxBid/acquisition-1,minDSCR:Math.min(...forecast.map(f=>f.dscr)),debtToNOI:year5.noi?(-year5.loanPayoff)/year5.noi:0,cashflows};
}
export function computeAll(spec){const a={};for(const deal of ['TX','Katy'])for(const scen of ['Base','Down','Up'])a[`${deal} ${scen}`]=computeDeal(spec.inputs[deal],spec.scenario[scen]);return a}
export function sensitivityTX(spec){const inps=spec.inputs.TX,scen=spec.scenario.Base,deal=computeDeal(inps,scen),last=deal.forecast[4];
 const occupancy=[.85,.87,.89,.91,.93,.95,.97],caps=[.07,.075,.08,.085,.09,.095,.10];
 const perUnit=last.rent+last.ancillary, inflation=Math.pow(1+inps['17'],4);
 const marginal=perUnit-inps['16']*inflation-(perUnit)*(inps['19']*scen['12']+inps['23']);
 return {occupancy,caps,rows:caps.map(c=>occupancy.map(o=>(last.noi+(o-last.occupancy)*inps['7']*12*marginal)/c))};
}
export function validateInput(row,v){
 const x=Number(v);if(!Number.isFinite(x))return false;
 if([8,9].includes(row))return x>=0&&x<=1;
 if([12,14,17,20,22].includes(row))return x>=-.20&&x<=.30;
 if([19,23,25,28,32,34,36,37,38,39].includes(row))return x>=0&&x<=(row===28?1:row===25?.20:row===32?.10:1);
 if([29,33].includes(row))return x>=.01&&x<=.30;
 if(row===30)return Number.isInteger(x)&&x>=0&&x<=5;
 if(row===31)return Number.isInteger(x)&&x>=5&&x<=40;
 if(row===35)return x===5;
 if(row===10)return Number.isInteger(x)&&x>=1&&x<=120;
 if(row===40)return x>=.5&&x<=4;
 return x>=0&&x<=10000000;
}
