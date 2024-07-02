import React, { useState, useEffect, useContext } from 'react';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import Image from 'react-bootstrap/Image';
import { UserContext } from '../Services/UserContext';
import { obtenerTokenFCM } from '../../firebaseConfig/firebase';
import { getMessaging, onMessage } from 'firebase/messaging';

const messaging = getMessaging();

export const Panico = () => {
  const { userData } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const inicializar = async () => {
      try {
        const token = await obtenerTokenFCM();
        setFcmToken(token);
      } catch (error) {
        console.error('Error obteniendo el token FCM: ', error);
      } finally {
        setIsLoading(false);
      }
    };
    inicializar();
  }, []);

  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log('Message received in Panico component. ', payload);
    });
  }, []);

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error obteniendo la ubicación: ', error);
        }
      );
    } else {
      console.error('Geolocalización no es soportada por este navegador.');
    }
  };

  const enviarMensaje = async (usuarios, mensaje, prioridad) => {
    const db = getFirestore();
    const promesasMensajes = usuarios.map(async (usuario) => {
      const mensajeRef = await addDoc(collection(db, 'mensajes'), {
        sender: `${userData.manzana}-${userData.lote}`,
        receiver: `${usuario.manzana}-${usuario.lote}`,
        content: mensaje,
        prioridad: prioridad,
        ubicacion: location,
        timestamp: new Date(),
        read: false,
        source: 'alerta',
      });
      return mensajeRef.id;
    });
    await Promise.all(promesasMensajes);
  };

  const ruidos = async () => {
    obtenerUbicacion();
    if (!userData || !userData.manzana || !userData.lote) {
      console.error('El usuario no tiene asignada una manzana o userData es null.');
      return;
    }

    try {
      const db = getFirestore();
      const usuariosManzanaQuery = query(collection(db, 'usuarios'), where('manzana', '==', userData.manzana));
      const usuariosSnapshot = await getDocs(usuariosManzanaQuery);
      const usuariosManzana = usuariosSnapshot.docs.map((doc) => doc.data());

      const mensaje = `Soy del lote ${userData.manzana}-${userData.lote} y escucho ruidos sospechosos por mi lote`;
      await enviarMensaje(usuariosManzana, mensaje, 'media');

      console.log('Mensajes enviados a todos los usuarios en la misma manzana');
    } catch (error) {
      console.error('Error enviando mensajes: ', error);
    }
  };

  const alerta = async () => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }
    if (!userData || !userData.manzana || !userData.isla) {
      console.error('El usuario no tiene asignada una isla o userData es null.');
      return;
    }

    try {
      const db = getFirestore();
      const usuariosIslaQuery = query(collection(db, 'usuarios'), where('isla', '==', userData.isla));
      const usuariosGuardiaQuery = query(collection(db, 'usuarios'), where('rol', '==', userData.rol.guardia));

      const [usuariosIslaSnapshot, usuariosGuardiaSnapshot] = await Promise.all([
        getDocs(usuariosIslaQuery),
        getDocs(usuariosGuardiaQuery),
        console.log("usuariosGuardiaQuery"),
      ]);

      const usuariosIsla = usuariosIslaSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const usuariosGuardia = usuariosGuardiaSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Evitar duplicados uniendo ambas listas y eliminando duplicados
      const todosUsuarios = [...usuariosIsla];
      usuariosGuardia.forEach((guardia) => {
        if (!todosUsuarios.some((user) => user.id === guardia.id)) {
          todosUsuarios.push(guardia);
        }
      });

      const mensaje = `Soy del lote ${userData.manzana}-${userData.lote} y necesito ayuda por mi lote`;
      await enviarMensaje(todosUsuarios, mensaje, 'alta');

      console.log('Mensajes enviados a todos los usuarios en la misma isla y a la guardia');
    } catch (error) {
      console.error('Error enviando mensajes: ', error);
    }
  };

  const llamar911 = () => {
    const numeroEmergencia = '911';
    const llamadaUrl = `tel:${numeroEmergencia}`;
    window.open(llamadaUrl);
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <main className="container fluid">
      <div className="container alertas">
        <div className="row justify-content-center">
          <div className="col col-12 col-sm-4 gx-4">
            <div className="card">
              <Image
                src="/img/seguridadAlerta.png"
                height="0.5%"
                className="card-img-top"
                alt="imagen de la guardia"
                onClick={alerta}
                roundedCircle
                fluid={true}
              />
              <div className="card-body">
                <h5 className="card-title">ALERTA</h5>
                <p className="card-text">Avisar a la guardia</p>
                <button type="button" value="alerta" className="btn btn-danger" onClick={alerta}>
                  ALERTA
                </button>
              </div>
            </div>
          </div>

          <div className="col col-12 col-sm-4 gx-4">
            <div className="card">
              <Image
                src="/img/vecinosAlerta.png"
                height="0.5%"
                sizes="mg"
                className="card-img-top"
                alt="imagen de los vecinos de la isla"
                onClick={ruidos}
                roundedCircle
              />
              <div className="card-body">
                <h5 className="card-title">RUIDOS</h5>
                <p className="card-text">Avisar a los vecinos de la isla</p>
                <button type="button" value="ruidos" className="btn btn-warning" onClick={ruidos}>
                  RUIDOS
                </button>
              </div>
            </div>
          </div>

          <div className="col col-12 col-sm-4 gx-4">
            <div className="card">
              <Image
                src="/img/911.png"
                height="0.5%"
                className="card-img-top"
                alt="imagen de la guardia"
                onClick={llamar911}
                roundedCircle
              />
              <div className="card-body">
                <h5 className="card-title">EMERGENCIA</h5>
                <p className="card-text">Llamar al 911</p>
                <button type="button" value="ayuda" className="btn btn-primary" onClick={llamar911}>
                  911
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
