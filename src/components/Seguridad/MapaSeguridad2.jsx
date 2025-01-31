import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const MapaSeguridad2 = () => {
  const [unidades, setUnidades] = useState([]);
  const [selected, setSelected] = useState({ manzana: '', lote: '' });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'mensajes'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newMessage = change.doc.data();
          setUnidades((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              manzana: newMessage.manzana,
              lote: newMessage.lote,
              position: { x: newMessage.x, y: newMessage.y },
            },
          ]);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawMap = () => {
      const img = new Image();
      img.src = '/img/planoIslas.png';
      img.onload = () => {
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = containerRef.current.offsetHeight;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        unidades.forEach((unidad) => {
          const x = (unidad.position.x / 1000) * canvas.width;
          const y = (unidad.position.y / 1000) * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
          ctx.stroke();

          ctx.font = '12px Arial';
          ctx.fillStyle = 'black';
          ctx.fillText(`M${unidad.manzana} L${unidad.lote}`, x + 12, y);
        });
      };
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 1000; // Normaliza la escala
      const y = ((e.clientY - rect.top) / rect.height) * 1000;

      if (!selected.manzana || !selected.lote) {
        alert('Selecciona una manzana y un lote antes de marcar.');
        return;
      }

      const nuevaUnidad = {
        id: unidades.length + 1,
        manzana: Number(selected.manzana),
        lote: Number(selected.lote),
        position: { x, y },
      };

      setUnidades((prev) => [...prev, nuevaUnidad]);

      console.log(` ${selected.manzana}: ${selected.lote}: {x: ${x}, y: ${y}},`);
    };

    canvas.addEventListener('click', handleClick);
    drawMap();
    window.addEventListener('resize', drawMap);

    return () => {
      window.removeEventListener('resize', drawMap);
      canvas.removeEventListener('click', handleClick);
    };
  }, [unidades, selected]);

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
      </div>
    </div>
  );
};
