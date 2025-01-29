import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig/firebase'; // Ajusta la ruta según tu estructura de proyecto
import { collection, onSnapshot } from 'firebase/firestore';

// Diccionario con coordenadas relativas de cada lote por manzana
const coordenadasLotes = {
  
  5: {
    1: { x: 262.3333282470703, y: 470.2708282470703 },
    2: { x: 272.3333282470703, y: 473.2708282470703 },
    3: { x: 279.3333282470703, y: 476.2708282470703 },
    4: { x: 280.3333282470703, y: 475.2708282470703 },
    5: { x: 290.3333282470703, y: 473.2708282470703 },
    6: { x: 301.3333282470703, y: 478.2708282470703 },
    7: { x: 308.3333282470703, y: 477.2708282470703 },
    8: { x: 317.3333282470703, y: 470.2708282470703 },
    9: { x: 326.3333282470703, y: 478.2708282470703 },
    10: { x: 334.3333282470703, y: 489.2708282470703 },
    11: { x: 333.3333282470703, y: 480.2708282470703 },
    12: { x: 342.3333282470703, y: 480.2708282470703 },
    13: { x: 344.3333282470703, y: 540.2708282470703 },
    14: { x: 335.3333282470703, y: 540.2708282470703 },
    15: { x: 336.3333282470703, y: 540.2708282470703 },
    16: {  x: 328.3333282470703, y: 540.2708282470703 },
    17: { x: 319.3333282470703, y: 540.2708282470703 },
    18: { x: 309.3333282470703, y: 540.2708282470703 },
    19: { x: 300.3333282470703, y: 540.2708282470703 },
    20: { x: 292.3333282470703, y: 540.2708282470703 },
    21: { x: 285.3333282470703, y: 540.2708282470703 },
    22: { x: 284.3333282470703, y: 560.2708282470703 },
    23: { x: 275.3333282470703, y: 540.2708282470703 },
    24: { x: 268.3333282470703, y: 540.2708282470703 },
    25: { x: 260.3333282470703, y: 540.2708282470703 },
    // Agrega más lotes aquí
  },
  6: {
    1: { x: 252, y: 640 },
    2: { x: 262, y: 640 },
    3: { x: 272, y: 640 },
    4: { x: 272, y: 640 },
    5: { x: 285, y: 640 },
    6: { x: 295, y: 640 },
    7: { x: 302, y: 640 },
    8: { x: 312, y: 640 },
    9: { x: 317, y: 640 },
    10: { x: 325, y: 630 },
    11: { x: 330, y: 630 },
    12: { x: 335, y: 620 },
    13: { x: 342, y: 620 },
    14: { x: 345, y: 660 },
    15: { x: 342, y: 670 },
    16: { x: 335, y: 675 },
    17: { x: 325, y: 675 },
    18: { x: 320, y: 675 },
    19: { x: 310, y: 675 },
    20: { x: 305, y: 670 },
    21: { x: 298, y: 680 },
    22: { x: 290, y: 680 },
    23: { x: 285, y: 685 },
    24: { x: 280, y: 685 },
    25: { x: 270, y: 685 },
    26: { x: 260, y: 685 },
    27: { x: 255, y: 685 },
    // Agrega más lotes aquí
  },
  7: {
    1: { x: 362.3333282470703, y: 450.2708282470703 },
    2: { x: 362, y: 450 },
    3: { x: 372, y: 450 },
    4: { x: 378, y: 450 },
    5: { x: 385, y: 450 },
    6: { x: 395, y: 450 },
    7: { x: 399, y: 450 },
    8: { x: 402, y: 450 },
    9: { x: 412, y: 450 },
    10: { x: 420, y: 450 },
    11: { x: 425, y: 450 },
    
    14: { x: 440, y: 540 },
    15: { x: 432, y: 540 },
    16: { x: 425, y: 545 },
    17: { x: 415, y: 545 },
    18: { x: 410, y: 545 },
    19: { x: 410, y: 545 },
    20: { x: 405, y: 540 },
    21: { x: 398, y: 540 },
    22: { x: 385, y: 540 },
    23: { x: 380, y: 545 },
    24: { x: 370, y: 545 },
    25: { x: 360, y: 545 },
    // Agrega más lotes aquí
  },
  4: {
    6: { x: 200, y: 600 },
    7: { x: 200, y: 600 },
    8: { x: 205, y: 600 },
    9: { x: 205, y: 600 },
    10: { x: 210, y: 600 },
    11: { x: 210, y: 600 },
    12: { x: 215, y: 600 },
    13: { x: 250, y: 600 },
    // Agrega más lotes aquí
  },
  // Agrega más manzanas aquí
};

export const MapaSeguridad2 = () => {
  const [unidades, setUnidades] = useState([ ]);
  const [selected, setSelected] = useState({ manzana: '', lote: '' });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'mensajes'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newMessage = change.doc.data();
          const updatedUnidades = unidades.map((unidad) =>
            unidad.manzana === newMessage.manzana && unidad.lote === newMessage.lote
              ? { ...unidad, position: coordenadasLotes[newMessage.manzana]?.[newMessage.lote] || unidad.position }
              : unidad
          );
          setUnidades(updatedUnidades);
        }
      });
    });

    return () => unsubscribe();
  }, [unidades]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawMap = () => {
      const img = new Image();
      img.src = '/img/planoIslas.png'; // Ruta de la imagen
      img.onload = () => {
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = containerRef.current.offsetHeight;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        unidades.forEach((unidad) => {
          const x = (unidad.position.x / 1000) * canvas.width;
          const y = (unidad.position.y / 1000) * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
          ctx.stroke();

          ctx.font = '12px Arial';
          ctx.fillStyle = 'black';
          ctx.fillText(`Manzana ${unidad.manzana} Lote ${unidad.lote}`, x + 12, y);
        });
      };
    };

    const handleClick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left; // Coordenada X relativa al canvas
        const y = e.clientY - rect.top;  // Coordenada Y relativa al canvas
        console.log(`Coordenadas del clic - x: ${x}, y: ${y}`);
        alert(`Coordenadas del clic - x: ${x}, y: ${y}`);
      };
    
      canvas.addEventListener('click', handleClick);
    
      drawMap();
      window.addEventListener('resize', drawMap);
      return () => {
        window.removeEventListener('resize', drawMap);
        canvas.removeEventListener('click', handleClick);
      };
    }, [unidades]);

  const handleMark = () => {
    const { manzana, lote } = selected;
    const nuevaPosicion = coordenadasLotes[Number(manzana)]?.[Number(lote)];

    if (nuevaPosicion) {
      setUnidades([...unidades, { id: unidades.length + 1, manzana: Number(manzana), lote: Number(lote), position: nuevaPosicion }]);
    } else {
      alert('Coordenadas no definidas para esta manzana y lote.');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '500px' }}>
      <h2>Mapa de Unidades Funcionales</h2>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ marginTop: '10px' }}>
        <input
          type="number"
          placeholder="Manzana"
          value={selected.manzana}
          onChange={(e) => setSelected({ ...selected, manzana: e.target.value })}
        />
        <input
          type="number"
          placeholder="Lote"
          value={selected.lote}
          onChange={(e) => setSelected({ ...selected, lote: e.target.value })}
        />
        <button onClick={handleMark}>Marcar</button>
      </div>
    </div>
  );
};
