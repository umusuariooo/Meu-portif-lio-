const filtros = [...document.querySelectorAll('[data-filtro]')];
const galeria = document.querySelector('#galeria .galeria');
const fotosGaleria = [...galeria.querySelectorAll('.foto')];
const contagem = document.querySelector('#contagem');
const destaques = document.querySelector('#fotos-destaque');
const fotosDestaque = [...destaques.querySelectorAll('img')];
const legendaDestaque = document.querySelector('#legenda-destaque');
const controlesDestaque = document.querySelector('.capa-controles');
const indiceDestaque = controlesDestaque.querySelector('.capa-indice');
const [destaqueAnterior, proximoDestaque] = controlesDestaque.querySelectorAll('button');
const visualizador = document.querySelector('dialog');
const imagemAmpliada = visualizador.querySelector('img');
const legenda = visualizador.querySelector('#legenda');
const anterior = visualizador.querySelector('#anterior');
const proxima = visualizador.querySelector('#proxima');

let fotosDoVisualizador = [];
let fotoAtual = 0;
let destaqueAtual = 0;

const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
const animacoes = new WeakMap();

function animarEntrada(elemento, distancia = 0) {
  if (movimentoReduzido.matches || !elemento.animate) return;

  animacoes.get(elemento)?.cancel();
  const animacao = elemento.animate(
    [
      { opacity: 0.55, transform: 'translateY(' + distancia + 'px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 340, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
  );
  animacoes.set(elemento, animacao);
}

function ativarDeslize(elemento, mudar) {
  let inicio;
  elemento.addEventListener('pointerdown', evento => {
    if (evento.pointerType !== 'touch') return;

    inicio = evento.isPrimary ? { id: evento.pointerId, x: evento.clientX, y: evento.clientY } : undefined;
  });
  elemento.addEventListener('pointercancel', evento => {
    if (inicio?.id === evento.pointerId) inicio = undefined;
  });
  elemento.addEventListener('pointerup', evento => {
    if (inicio?.id !== evento.pointerId) return;

    const horizontal = evento.clientX - inicio.x;
    const vertical = evento.clientY - inicio.y;
    inicio = undefined;

    if (Math.abs(horizontal) >= 48 && Math.abs(horizontal) > Math.abs(vertical) * 1.5) {
      mudar(horizontal < 0 ? 1 : -1);
    }
  });
}

function mudarDestaque(direcao) {
  fotosDestaque[destaqueAtual].hidden = true;
  const total = fotosDestaque.length;
  destaqueAtual = (destaqueAtual + direcao + total) % total;
  const foto = fotosDestaque[destaqueAtual];
  foto.hidden = false;
  legendaDestaque.textContent = foto.dataset.titulo;
  indiceDestaque.textContent = String(destaqueAtual + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
  animarEntrada(foto);
}

controlesDestaque.hidden = false;
destaqueAnterior.addEventListener('click', () => mudarDestaque(-1));
proximoDestaque.addEventListener('click', () => mudarDestaque(1));
ativarDeslize(destaques, mudarDestaque);

if ('IntersectionObserver' in window && !movimentoReduzido.matches) {
  const observador = new IntersectionObserver(entradas => {
    for (const entrada of entradas) {
      if (entrada.isIntersecting) {
        animarEntrada(entrada.target, 12);
        observador.unobserve(entrada.target);
      }
    }
  }, { threshold: 0.12 });

  for (const elemento of document.querySelectorAll('.cabecalho-secao, .servicos-lista, .processo, .sobre-texto, .contato-conteudo')) {
    observador.observe(elemento);
  }
}

for (const filtro of filtros) {
  filtro.addEventListener('click', () => {
    if (filtro.getAttribute('aria-pressed') === 'true') return;

    for (const botao of filtros) {
      botao.setAttribute('aria-pressed', String(botao === filtro));
    }

    const categoria = filtro.dataset.filtro;
    for (const foto of fotosGaleria) {
      foto.hidden = categoria !== 'todas' && foto.dataset.categoria !== categoria;
    }

    const total = fotosGaleria.filter(foto => !foto.hidden).length;
    contagem.textContent = total === 1 ? '1 foto' : total + ' fotos';
    animarEntrada(galeria, 6);
  });
}

function mostrarFoto(indice) {
  const total = fotosDoVisualizador.length;
  fotoAtual = (indice + total) % total;
  const foto = fotosDoVisualizador[fotoAtual];
  const imagem = foto.querySelector('img');
  imagemAmpliada.src = imagem.currentSrc || imagem.src;
  imagemAmpliada.alt = imagem.alt;
  legenda.textContent = foto.querySelector('strong').textContent + ' · ' + (fotoAtual + 1) + ' de ' + total;
}

for (const foto of document.querySelectorAll('.foto')) {
  foto.addEventListener('click', () => {
    fotosDoVisualizador = [...foto.closest('.galeria').querySelectorAll('.foto:not([hidden])')];
    anterior.disabled = proxima.disabled = fotosDoVisualizador.length < 2;
    mostrarFoto(fotosDoVisualizador.indexOf(foto));
    visualizador.showModal();
  });
}

function mudarFoto(direcao) {
  if (fotosDoVisualizador.length < 2) return;

  mostrarFoto(fotoAtual + direcao);
  animarEntrada(imagemAmpliada);
}

anterior.addEventListener('click', () => mudarFoto(-1));
proxima.addEventListener('click', () => mudarFoto(1));
ativarDeslize(imagemAmpliada, mudarFoto);

visualizador.addEventListener('keydown', evento => {
  if (evento.key === 'ArrowLeft' || evento.key === 'ArrowRight') {
    evento.preventDefault();
    mudarFoto(evento.key === 'ArrowLeft' ? -1 : 1);
  }
});

visualizador.addEventListener('click', evento => {
  if (evento.target === visualizador) visualizador.close();
});
