<template>
  <section class="main-visual">
    <div class="main-visual-img">
      <img src="/img/KV.png" alt="メインビジュアル">
    </div>
  </section>
</template>

<style scoped>
.main-visual {
  margin: 20px 0;
}

.main-visual-img img {
  margin: auto;
  padding-top: 150px;
  padding-bottom: 150px;
  width: 25%;
  max-width: 25%;
  display: block;
}

@media (max-width: 600px) {
  .main-visual-img img {
    padding-top: 25px;
    padding-bottom: 25px;
    width: 80%;
    max-width: 80%;
  }
}
</style> 