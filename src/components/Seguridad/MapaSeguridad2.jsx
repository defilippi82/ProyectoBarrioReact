import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig/firebase'; // Ajusta la ruta según tu estructura de proyecto
import { collection, onSnapshot } from 'firebase/firestore';

// Diccionario con coordenadas relativas de cada lote por manzana
const coordenadasLotes = {
  5: {
    4: { x: 300, y: 462 },
    5: { x: 305, y: 462 },
    6: { x: 310, y: 462 },
    7: { x: 315, y: 462 },
    8: { x: 320, y: 462 },
    9: { x: 325, y: 462 },
    10: { x: 330, y: 452 },
    11: { x: 335, y: 452 },
    12: { x: 345, y: 452 },
    15: { x: 330, y: 472 },
    14: { x: 335, y: 472 },
    13: { x: 340, y: 472 },
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

    drawMap();
    window.addEventListener('resize', drawMap);
    return () => window.removeEventListener('resize', drawMap);
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
