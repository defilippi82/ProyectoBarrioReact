import React, { useState, useEffect, useContext } from 'react';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import Image from 'react-bootstrap/Image';
import { UserContext } from "../Services/UserContext";
import { obtenerTokenFCM } from '../../firebaseConfig/firebase';


export const Panico = () => {
  const { userData } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const inicializar = async () => {
      const token = await obtenerTokenFCM();
      setFcmToken(token);
      setIsLoading(false);
    };
    inicializar();
  }, []);
  useEffect(() => {
    messaging.onMessage(payload => {
      console.log('Message received in Panico component. ', payload);
      // Aquí puedes manejar la notificación específica para Panico
    });
  }, []);

  const enviarNotificacion = async (usuarios, mensaje, prioridad) => {
    const db = getFirestore();
    const notificacionesRef = collection(db, 'notificaciones');
    
    const promesasNotificaciones = usuarios.map(async (usuario) => {
      await addDoc(notificacionesRef, {
        token: usuario.fcmToken,
        mensaje: mensaje,
        prioridad: prioridad,
        timestamp: new Date(),
      });
    });

    await Promise.all(promesasNotificaciones);
  };

  useEffect(() => {
    setIsLoading(false); // Simular carga inicial, puedes ajustarlo según tu lógica real
  }, []);
  /*
  const ruidos = async () => {
    try {
      if (!userData || !userData.manzana || !userData.lote) {
        console.error("El usuario no tiene asignada una manzana o userData es null.");
        return;
      }

      const db = getFirestore();
      const usuariosManzanaQuery = query(
        collection(db, 'usuarios'),
        where('manzana', '==', userData.manzana)
      );
      const usuariosGuardiaQuery = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'guardia')
      );

      const [usuariosManzanaSnapshot, usuariosGuardiaSnapshot] = await Promise.all([
        getDocs(usuariosManzanaQuery),
        getDocs(usuariosGuardiaQuery)
      ]);

      const usuariosManzana = usuariosManzanaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usuariosGuardia = usuariosGuardiaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const usuariosCombinados = [...usuariosManzana, ...usuariosGuardia];

      const mensaje = `Soy del lote ${userData.manzana}-${userData.lote} y escucho ruidos sospechosos por mi lote`;
      await enviarNotificacion(usuariosCombinados, mensaje, 'media');

      console.log('Notificaciones enviadas a los usuarios de la misma manzana y al personal de seguridad');
    } catch (error) {
      console.error("Error enviando notificaciones: ", error);
    }
  };

  const alerta = async () => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }
    if (!userData || !userData.manzana || !userData.isla) {
      console.error("El usuario no tiene asignada una isla o userData es null.");
      return;
    }
    try {
      const db = getFirestore();
      const usuariosIslaQuery = query(
        collection(db, 'usuarios'),
        where('isla', '==', userData.isla)
      );
      const usuariosGuardiaQuery = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'guardia')
      );

      const [usuariosIslaSnapshot, usuariosGuardiaSnapshot] = await Promise.all([
        getDocs(usuariosIslaQuery),
        getDocs(usuariosGuardiaQuery)
      ]);

      const usuariosIsla = usuariosIslaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usuariosGuardia = usuariosGuardiaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const usuariosCombinados = [...usuariosIsla, ...usuariosGuardia];

      const mensaje = `Soy del lote ${userData.manzana}-${userData.lote} y necesito ayuda por mi lote`;
      await enviarNotificacion(usuariosCombinados, mensaje, 'alta');

      console.log('Notificaciones enviadas a todos los usuarios en la misma isla y al personal de seguridad');
    } catch (error) {
      console.error("Error enviando notificaciones: ", error);
    }
  };*/

 const ruidos = async () => {
    try {
      if (!userData || !userData.manzana || !userData.lote) {
        console.error("El usuario no tiene asignada una manzana o userData es null.");
        return;
      }

      const db = getFirestore();
      const q = query(
        collection(db, 'usuarios'),
        where('manzana', '==', userData.manzana)
      );

      const querySnapshot = await getDocs(q);
      const usersInSameManzana = querySnapshot.docs.map(doc => doc.data());

      const messagePromises = usersInSameManzana.map(user => {
        return addDoc(collection(db, 'mensajes'), {
          sender: `${userData.manzana}-${userData.lote}`,
          receiver: `${user.manzana}-${user.lote}`,
          content: `Soy del lote ${userData.manzana}-${userData.lote} y escucho ruidos sospechosos por mi lote`,
          timestamp: new Date(),
          read: false,
          source: 'alerta'
        });
      });

      await Promise.all(messagePromises);
      console.log('Mensajes enviados a todos los usuarios en la misma manzana');
    } catch (error) {
      console.error("Error enviando mensajes: ", error);
    }
  };

  const alerta = async () => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }
    if (!userData || !userData.manzana || !userData.isla) {
      console.error("El usuario no tiene asignada una isla o userData es null.");
      return;
    }
    try {
      const db = getFirestore();
      // Consultar usuarios de la misma isla
      const usuariosIslaQuery = query(
        collection(db, 'usuarios'),
        where('isla', '==', userData.isla)
      );

      const usuariosGuardiaQuery = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'guardia')
      );

      const [usuariosIslaSnapshot, usuariosGuardiaSnapshot] = await Promise.all([
        getDocs(usuariosIslaQuery),
        getDocs(usuariosGuardiaQuery)
      ]);

      const usuariosIsla = usuariosIslaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usuariosGuardia = usuariosGuardiaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Unificar ambos conjuntos de usuarios, evitando duplicados
      const usuariosCombinados = [...usuariosIsla];
      usuariosGuardia.forEach(guardia => {
        if (!usuariosIsla.some(user => user.id === guardia.id)) {
          usuariosCombinados.push(guardia);
        }
      });

      const messagePromises = usuariosCombinados.map(user => {
        return addDoc(collection(db, 'mensajes'), {
          sender: `${userData.manzana}-${userData.lote}`,
          receiver: `${user.manzana}-${user.lote}`,
          content: `Soy del lote ${userData.manzana}-${userData.lote} y necesito ayuda por mi lote`,
          timestamp: new Date(),
          read: false,
          source: 'alerta'
        });
      });

      await Promise.all(messagePromises);
      console.log('Mensajes enviados a todos los usuarios en la misma isla y a la guardia');
    } catch (error) {
      console.error("Error enviando mensajes: ", error);
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
                src={"/img/seguridadAlerta.png"}
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
                <button
                  type="button"
                  value="alerta"
                  className="btn btn-danger"
                  onClick={alerta}
                >
                  ALERTA
                </button>
              </div>
            </div>
          </div>

          <div className="col col-12 col-sm-4 gx-4">
            <div className="card">
              <Image
                src={"/img/vecinosAlerta.png"}
                height="0.5%"
                sizes='mg'
                className="card-img-top"
                alt="imagen de los vecinos de la isla"
                onClick={ruidos}
                roundedCircle
              />
              <div className="card-body">
                <h5 className="card-title">RUIDOS</h5>
                <p className="card-text">Avisar a los vecinos de la isla</p>
                <button
                  type="button"
                  value="ruidos"
                  className="btn btn-warning"
                  onClick={ruidos}
                >
                  RUIDOS
                </button>
              </div>
            </div>
          </div>

          <div className="col col-12 col-sm-4  gx-4">
            <div className="card">
              <Image
                src={"/img/911.png"}
                height="0.5%"
                className="card-img-top"
                alt="imagen de la guardia"
                onClick={llamar911}
                roundedCircle
              />
              <div className="card-body">
                <h5 className="card-title">EMERGENCIA</h5>
                <p className="card-text">Llamar al 911</p>
                <button
                  type="button"
                  value="ayuda"
                  className="btn btn-primary"
                  onClick={llamar911}
                >
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
