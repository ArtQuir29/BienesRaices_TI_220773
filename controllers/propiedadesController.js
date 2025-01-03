import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js'
import { unlink } from 'node:fs/promises'
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) => {

    //Leer QueryString
    const { pagina: paginaActual } = req.query
    const expresion = /^[0-9]$/

    if (!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const { id } = req.usuario

        //Limites y Dffset para el paginador
        const limit = 10;
        const offset = ((paginaActual * limit) - limit)

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioID: id
                },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' }
                    
                ],
            }),
            Propiedad.count({
                where: {
                    usuarioID: id
                }
            })
        ])
        console.log(total)
        res.render('propiedades/admin', {
            pagina: 'Mis propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit,
        })

    } catch (error) {
        console.log(error)
    }

}

//Formulario para crear una nueva propiedad
const crear = async (req, res) => {

    //Consultar Modelo de Precio y Categorias

    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/crear', {
        pagina: 'Crear propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}
const guardar = async (req, res) => {
    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ]);

        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        });
    }

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioID, categoria: categoriaID, operacion } = req.body;
    const { id: usuarioID } = req.usuario;

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioID,
            categoriaID,
            operacion,
            usuarioID,
            imagen: '',
            operacion
        });

        res.redirect(`/propiedades/agregar-imagen/${propiedadGuardada.id}`);
    } catch (error) {
        console.log(error);
        res.redirect('/mis-propiedades');
    }
};

const agregarImagen = async (req, res) => {

    const { id } = req.params
    //Validar que la propiedad exista

    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    //validar que la propiedD NO ESTE PUBLICADA
    if (propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }
    //validar que la propiedad  pertenece a quien visita esta pagina

    if (req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return res.redirect('/mis-propiedades')
    }

    return res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
}

const almacenarImagen = async (req, res, next) => {

    const { id } = req.params
    // Validar que la propiedad exista

    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad NO ESTÉ PUBLICADA
    if (propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad pertenezca a quien visita esta página

    if (req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return res.redirect('/mis-propiedades')
    }

    try {
        console.log(req.file)
        // Almacenar propiedad y publicarla

        propiedad.imagen = req.file.filename
        propiedad.publicado = 1
        await propiedad.save();

        // Si todo es exitoso, pasar al siguiente middleware o función
        next();

    } catch (error) {
        console.log(error);
        // Manejar errores aquí
        // Puedes redirigir a una página de error o hacer algo más según tus necesidades
        res.redirect('/mis-propiedades');
    }
}


const editar = async (req, res) => {

    //validaciones

    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    //consultar el precio y categorias

    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/editar', {
        pagina: `Editar propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })

}

const guardarCambios = async (req, res) => {
    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ]);

        return res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        });
    }

    const { id } = req.params;
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioID, categoria: categoriaID, operacion } = req.body;

    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad || propiedad.usuarioID !== req.usuario.id) {
        return res.redirect('/mis-propiedades');
    }

    try {
        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioID,
            categoriaID,
            operacion
        });

        await propiedad.save();
        res.redirect('/mis-propiedades');
    } catch (error) {
        console.log(error);
    }
};

const eliminar = async (req, res) => {
    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    //Elminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`)
    console.log(`se elimino la imagen ${propiedad.imagen}`)
    //Eliminar la propiedad

    await propiedad.destroy()
    res.redirect('/mis-propiedades')
}

//Modificar el estado de la propiedad
const cambiarEstado = async (req, res) => {
    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    //Actualizar 

    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: 'true'
    })

}

const mostrarPropiedad = async (req, res) => {
    const { id } = req.params;

    // Comprobar que la propiedad exista e incluir los datos del vendedor
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
            { model: Usuario, as: 'usuario', attributes: ['alias', 'foto'] } 
        ]
    });
    

    if (!propiedad || !propiedad.publicado) {
        return res.redirect('/404');
    }

    console.log('Datos del vendedor:', propiedad.usuario); // Para depuración

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID),
    });
    

};

export default mostrarPropiedad;

export const obtenerPropiedades = async (req, res) => {
    try {
        const propiedades = await Propiedad.findAll({
            include: [
                { model: Categoria, as: 'categoria' },
                { model: Precio, as: 'precio' },
                { model: Usuario, as: 'usuario', attributes: ['alias', 'foto'] }
            ]
        });

        console.log('Propiedades:', JSON.stringify(propiedades, null, 2)); // Verificar datos del vendedor

        res.render('propiedades/lista', {
            propiedades,
            pagina: 'Propiedades'
        });
    } catch (error) {
        console.error(error);
        res.redirect('/500');
    }
};

const enviarMensaje = async (req, res) => {

    const { id } = req.params

    //Comprobar que la propieadad exista

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
            { model: Usuario, as: 'usuario', attributes: ['alias', 'foto'] }
        ]
    })

    if (!propiedad) {
        return res.redirect('/404')
    }


    //renderizar errores

    //Validacion
    let resultado = validationResult(req)

    if (!resultado.isEmpty()) {

        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID),
            errores: resultado.array()
        })
    }


    const { mensaje } = req.body
    const { id: propiedadID } = req.params
    const { id: usuarioID } = req.usuario
    //Almacenar el mensaje

    await Mensaje.create({
        mensaje,
        propiedadID,
        usuarioID
    })

    res.redirect('/')
}

//Leer mensajes recibidos

const verMensajes = async (req, res) => {
    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {
                model: Mensaje, as: 'mensajes',
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario', attributes: ['nombre', 'email', 'alias', 'foto'] }
                ]
            },
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'foto'] } // Incluye al propietario de la propiedad
        ],
    });
    
    if (!propiedad) {
        return res.redirect('/mis-propiedades');
    }
    
    // Asegúrate de que el usuario autenticado sea el propietario de la propiedad
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades');
    }
    
    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        propiedad, // Pasa la propiedad completa a la vista
        formatearFecha,
        csrfToken: req.csrfToken()
    });
}
const responderMensaje = async (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;

    try {
        // Validar que haya una respuesta
        if (!respuesta || respuesta.trim() === '') {
            return res.status(400).send('La respuesta no puede estar vacía.');
        }

        // Buscar el mensaje y actualizar su respuesta
        const mensaje = await Mensaje.findByPk(id);
        if (!mensaje) {
            return res.status(404).send('Mensaje no encontrado.');
        }

        // Guardar la respuesta
        mensaje.respuesta = respuesta;
        await mensaje.save();

        // Redirigir al usuario después de responder
        res.redirect('/mis-propiedades');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al guardar la respuesta.');
    }
};

export {
    admin,
    crear,
    guardar,
    editar,
    agregarImagen,
    almacenarImagen,
    guardarCambios,
    eliminar,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes,
    cambiarEstado,
    responderMensaje,
}

