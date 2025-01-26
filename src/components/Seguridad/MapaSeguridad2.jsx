import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig/firebase'; // Ajusta la ruta según tu estructura de proyecto
import { collection, onSnapshot } from 'firebase/firestore';

// Diccionario con coordenadas relativas de cada lote por manzana
const coordenadasLotes = {
  5: {
    1: { x: 312.3333282470703, y: 440.2708282470703 },
    2: { x: 322.3333282470703, y: 443.2708282470703 },
    3: { x: 329.3333282470703, y: 446.2708282470703 },
    4: { x: 340.3333282470703, y: 445.2708282470703 },
    5: { x: 350.3333282470703, y: 443.2708282470703 },
    6: { x: 361.3333282470703, y: 438.2708282470703 },
    7: { x: 368.3333282470703, y: 437.2708282470703 },
    8: { x: 377.3333282470703, y: 440.2708282470703 },
    9: { x: 386.3333282470703, y: 438.2708282470703 },
    10: { x: 394.3333282470703, y: 439.2708282470703 },
    11: { x: 403.3333282470703, y: 440.2708282470703 },
    12: { x: 412.3333282470703, y: 440.2708282470703 },
    13: { x: 414.3333282470703, y: 466.2708282470703 },
    14: { x: 405.3333282470703, y: 472.2708282470703 },
    15: { x: 396.3333282470703, y: 469.2708282470703 },
    16: {  x: 388.3333282470703, y: 475.2708282470703 },
    17: { x: 379.3333282470703, y: 470.2708282470703 },
    18: { x: 369.3333282470703, y: 475.2708282470703 },
    19: { x: 360.3333282470703, y: 475.2708282470703 },
    20: { x: 352.3333282470703, y: 476.2708282470703 },
    21: { x: 345.3333282470703, y: 474.2708282470703 },
    22: { x: 334.3333282470703, y: 480.2708282470703 },
    23: { x: 325.3333282470703, y: 474.2708282470703 },
    24: { x: 318.3333282470703, y: 477.2708282470703 },
    25: { x: 310.3333282470703, y: 471.2708282470703 },
    // Agrega más lotes aquí
  },
  6: {
    1: { x: 300, y: 600 },
    2: { x: 305, y: 600 },
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
  const [unidades, setUnidades] = useState([
    { id: 1, manzana: 5, lote: 10, position: coordenadasLotes[5][10] },
  ]);
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
