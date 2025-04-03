
const indexHeaderContainer = document.getElementById("index-header-container");





// index.html case (path to header.html is different)
if(indexHeaderContainer){
  fetch("src/views/header.html")
  .then(response => response.text())
  .then(data => {
      indexHeaderContainer.innerHTML = data;
  });
} 
else{
  fetch("header.html")
  .then(response => response.text())
  .then(data => {
    const headerContainer = document.getElementById("header-container");
    if (headerContainer)
      headerContainer.innerHTML = data;
  });
}