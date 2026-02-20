

(async () => {

  const max = await web3Utils.numTokensMinted();
  let arr = await db.numWeek16Scores();
  arr.sort(function(a, b) {
    return a - b;
  });

  let missingIds = [];
  for (let i = 0; i < max; i++) {
    
    if(arr[i] != i){
      missingIds.push(i);
    }
  }

  console.log(missingIds);
  console.log('...finished')

})();



