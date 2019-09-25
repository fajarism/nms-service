const axios = require('axios');

function checkStatus(){
    axios.get('http://localhost:3000/api/group/all')
    .then(response => {
      var array = response.data.data;
      array.forEach(element => {
          var url = 'http://localhost:3000/api/status/update/' + element.groupId;
//          console.log(url);
          axios.get(url).then(res=>{
  //            console.log(res.data);
          });
      });
    })
    .catch(error => {
    //  console.log(error);
    });
}

setInterval(checkStatus,10000);
