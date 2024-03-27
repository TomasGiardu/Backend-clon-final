class Carrito {
    constructor() {
        this.Carritos = [];
        this.UltimoID = 0;
    }

    // Función para crear un nuevo carrito
    crearCarrito(productos) {
        this.UltimoID++;
        const nuevoCarrito = {
            ID: this.UltimoID,
            Products: productos || [],
        };
        this.Carritos.push(nuevoCarrito);
        return nuevoCarrito;
    }

    // Función para obtener productos de un carrito específico
    obtenerCarritoPorId(cartId) {
        const carrito = this.Carritos.find(c => c.ID === cartId);
        return carrito ? carrito.Products : [];
    }
}

module.exports = Carrito;


