import React, { useState, useEffect, useContext } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import Image from 'react-bootstrap/Image';
import {UserContext} from "../Services/UserContext";

export const Panico = () => {
  const { userData } = useContext(UserContext);
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setIsLoading(false); // Simular carga inicial, puedes ajustarlo según tu lógica real
  }, []);
    /*const obtenerDatosUsuario = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const db = getFirestore();
          const usuarioDocRef = doc(db, 'usuarios', user.uid);
          const usuarioDocSnap = await getDoc(usuarioDocRef);

          if (usuarioDocSnap.exists()) {
            const userData = usuarioDocSnap.data();
            setUserData(userData);
          } else {
            console.log('No se encontraron datos del usuario en Firestore');
          }
        } else {
          console.log('No hay usuario autenticado');
        }
      } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    obtenerDatosUsuario();
  }, []);*/

  
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
          sender: userData.nombre,
          receiver: user.nombre,
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
  
  const alerta = async() => {
  if (isLoading) {
    return <div>Cargando...</div>;
    }
    if (!userData || !userData.manzana || !userData.isla) {
      console.error("El usuario no tiene asignada una isla o userData es null.");
      return;
    }
    try{

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
        sender: userData.nombre,
        receiver: user.nombre,
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


    /* ENVIAR MENSAJE POR WHATSAPP
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitud = position.coords.latitude;
          const longitud = position.coords.longitude;
          const mensaje = `Soy del lote ${userData?.lote}, en la manzana ${userData?.manzana} y necesito ayuda por acá: ${latitud}, ${longitud}`;
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${userData?.numerotelefono}&text=${encodeURIComponent(mensaje)}`;
          window.location.href = whatsappUrl;
        },
        (error) => {
          console.log('Error al obtener la ubicación:', error);
        }
      );
    } else {
      console.log('Geolocalización no es compatible con este navegador.');
    }*/
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