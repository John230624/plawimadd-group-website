// assets/assets.ts

// --- IMPORTANT : Importez les images locales comme des modules pour Next.js ---
// Le chemin correct pour les images dans 'public/images' depuis 'assets/assets.ts'
// est '../public/images/'.
// '../' sort du dossier 'assets', puis 'public/images/' entre dans le dossier 'public' et 'images'.

// --- SVG Icons - Maintenant importés comme modules ---
import logo from '../public/images/seller-logo.svg';
import search_icon from '../public/images/search_icon.svg';
import user_icon from '../public/images/user_icon.svg';
import cart_icon from '../public/images/cart_icon.svg';
import add_icon from '../public/images/add_icon.svg';
import order_icon from '../public/images/order_icon.svg';
import instagram_icon from '../public/images/instagram_icon.svg';
import facebook_icon from '../public/images/facebook_icon.svg';
import twitter_icon from '../public/images/twitter_icon.svg';
import box_icon from '../public/images/box_icon.svg';
import product_list_icon from '../public/images/product_list_icon.svg';
import menu_icon from '../public/images/menu_icon.svg';
import arrow_icon from '../public/images/arrow_icon.svg';
import increase_arrow from '../public/images/increase_arrow.svg';
import decrease_arrow from '../public/images/decrease_arrow.svg';
import arrow_right_icon_colored from '../public/images/arrow_right_icon_colored.svg';
import my_location_image from '../public/images/my_location_image.svg';
import arrow_icon_white from '../public/images/arrow_icon_white.svg';
import heart_icon from '../public/images/heart_icon.svg';
import star_icon from '../public/images/star_icon.svg';
import redirect_icon from '../public/images/redirect_icon.svg';
import star_dull_icon from '../public/images/star_dull_icon.svg';

// --- PNG Images - Maintenant importées comme modules ---
import header_ordi_hp_probook_image from '../public/images/header_ordi_hp_probook_image.png';
import header_casque_image from '../public/images/header_casque_image.png';
import header_tv_image from '../public/images/header_tv_image.png';
import macbook_image from '../public/images/macbook_image.png';
import bose_headphone_image from '../public/images/bose_headphone_image.png';
import apple_earphone_image from '../public/images/apple_earphone_image.png';
import samsung_s23phone_image from '../public/images/samsung_s23phone_image.png';
import venu_watch_image from '../public/images/venu_watch_image.png';
import upload_area from '../public/images/upload_area.png';
import cannon_camera_image from '../public/images/cannon_camera_image.png';
import sony_airbuds_image from '../public/images/sony_airbuds_image.png';
import asus_laptop_image from '../public/images/asus_laptop_image.png';
import projector_image from '../public/images/projector_image.png';
import playstation_image from '../public/images/playstation_image.png';
import girl_with_headphone_image from '../public/images/girl_with_headphone_image.png';
import girl_with_earphone_image from '../public/images/girl_with_earphone_image.png';
import banner_bg2_image from '../public/images/banner_bg2_image.png';
import sm_controller_image from '../public/images/sm_controller_image.png';
import banner_bg1_image from '../public/images/banner_bg1_image.png';
import boy_with_laptop_image from '../public/images/boy_with_laptop_image.png';
import checkmark from '../public/images/checkmark.png';
import product_details_page_apple_earphone_image1 from '../public/images/product_details_page_apple_earphone_image1.png';
import product_details_page_apple_earphone_image2 from '../public/images/product_details_page_apple_earphone_image2.png';
import product_details_page_apple_earphone_image3 from '../public/images/product_details_page_apple_earphone_image3.png';
import product_details_page_apple_earphone_image4 from '../public/images/product_details_page_apple_earphone_image4.png';
import product_details_page_apple_earphone_image5 from '../public/images/product_details_page_apple_earphone_image5.png';
import default_product_image from '../public/images/default_product_image.png';

// --- Exported Assets Object (Contient maintenant les objets StaticImageData pour Next.js Image) ---
export const assets = {
    logo,
    search_icon,
    user_icon,
    cart_icon,
    add_icon,
    order_icon,
    instagram_icon,
    facebook_icon,
    twitter_icon,
    box_icon,
    product_list_icon,
    menu_icon,
    arrow_icon,
    increase_arrow,
    decrease_arrow,
    arrow_right_icon_colored,
    my_location_image,
    arrow_icon_white,
    heart_icon,
    star_icon,
    redirect_icon,
    star_dull_icon,
    header_ordi_hp_probook_image,
    header_casque_image,
    header_tv_image,
    macbook_image,
    bose_headphone_image,
    apple_earphone_image,
    samsung_s23phone_image,
    venu_watch_image,
    upload_area,
    cannon_camera_image,
    sony_airbuds_image,
    asus_laptop_image,
    projector_image,
    playstation_image,
    girl_with_headphone_image,
    girl_with_earphone_image,
    banner_bg2_image,
    sm_controller_image,
    banner_bg1_image,
    boy_with_laptop_image,
    product_details_page_apple_earphone_image1,
    product_details_page_apple_earphone_image2,
    product_details_page_apple_earphone_image3,
    product_details_page_apple_earphone_image4,
    product_details_page_apple_earphone_image5,
    checkmark,
    default_product_image,
};

// --- TypeScript Interfaces for Dummy Data ---

// Interface for a single product
export interface Product {
    id: string; // Changed from _id to id for consistency with Prisma/NextAuth
    userId: string;
    name: string;
    description: string;
    price: number;
    offerPrice?: number; // Made optional as it might not always be present, and can be 0 or null if not an offer
    image: string[]; // Array of image URLs (these are typically external URLs or paths if not using next/image for every product image)
    category: string;
    date: number; // Unix timestamp
    rating?: number; // Optional rating
    // __v: number; // __v is typically for MongoDB/Mongoose, not needed for Prisma/SQL
}

// Interface for a user
export interface User {
    id: string; // Changed from _id to id for consistency with Prisma/NextAuth
    name: string;
    email: string;
    imageUrl?: string; // Made optional, as it might not always be present
    cartItems: { [productId: string]: number }; // Object where keys are product IDs and values are quantities
    // __v: number; // Not needed for Prisma/SQL
}

// Interface for an address within an order
export interface OrderAddress {
    id: string; // Changed from _id to id for consistency
    userId: string;
    fullName: string;
    phoneNumber: string;
    pincode: number;
    area: string;
    city: string;
    state: string;
    // __v: number; // Not needed for Prisma/SQL
}

// Interface for an item within an order
export interface OrderItem {
    product: Product; // Full product details nested
    quantity: number;
    id: string; // Changed from _id to id for consistency
}

// Interface for an order
export interface Order {
    id: string; // Changed from _id to id for consistency
    userId: string;
    items: OrderItem[];
    amount: number;
    address: OrderAddress;
    status: string;
    date: number; // Unix timestamp
    // __v: 0, // Not needed for Prisma/SQL
}

// --- Dummy Data (Typed) ---

export const productsDummyData: Product[] = [
    {
        id: "67a1f4e43f34a77b6dde9144", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Apple AirPods Pro 2nd gen",
        description: "Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C) provide excellent sound, active noise cancellation, and a comfortable fit. The USB-C case ensures quick charging, and they pair seamlessly with Apple devices for an effortless audio experience.",
        price: 499.99,
        offerPrice: 399.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/k4dafzhwhgcn5tnoylrw.webp",
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/j212frakb8hdrhvhajhg.webp",
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/imwuugqxsajuwqpkegb5.webp",
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/k1oqaslw5tb3ebw01vvj.webp",
        ],
        category: "Earphone",
        date: 1738667236865,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f52e3f34a77b6dde914a", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Bose QuietComfort 45",
        description: "The Bose QuietComfort 45 headphones are engineered for exceptional sound quality and unparalleled noise cancellation. With a 24-hour battery life and comfortable, lightweight design, these headphones deliver premium audio for any environment. Whether on a flight, in the office, or at home, the Bose QC45 blocks out distractions, offering an immersive listening experience.",
        price: 429.99,
        offerPrice: 329.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/m16coelz8ivkk9f0nwrz.webp",
        ],
        category: "Headphone",
        date: 1738667310300,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f5663f34a77b6dde914c", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Samsung Galaxy S23",
        description: "The Samsung Galaxy S23 offers an all-encompassing mobile experience with its advanced AMOLED display, offering vibrant visuals and smooth interactions. Equipped with top-of-the-line fitness tracking features and cutting-edge technology, this phone delivers outstanding performance. With powerful hardware, a sleek design, and long battery life, the S23 is perfect for those who demand the best in mobile innovation.",
        price: 899.99,
        offerPrice: 799.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/xjd4eprpwqs7odbera1w.webp",
        ],
        category: "Smartphone",
        date: 1738667366224,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f5993f34a77b6dde914e", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Garmin Venu 2",
        description: "The Garmin Venu 2 smartwatch blends advanced fitness tracking with sophisticated design, offering a wealth of features such as heart rate monitoring, GPS, and sleep tracking. Built with a 24-hour battery life, this watch is ideal for fitness enthusiasts and anyone looking to enhance their daily lifestyle. With a stunning AMOLED display and customizable watch faces, the Venu 2 combines technology with style seamlessly.",
        price: 399.99,
        offerPrice: 349.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/hdfi4u3fmprazpnrnaga.webp",
        ],
        category: "Earphone", // Correct this category if it's a smartwatch
        date: 1738667417511,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f5ef3f34a77b6dde9150", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "PlayStation 5",
        description: "The PlayStation 5 takes gaming to the next level with ultra-HD graphics, a powerful 825GB SSD, and ray tracing technology for realistic visuals. Whether you're into high-action games or immersive storytelling, the PS5 delivers fast loading times, seamless gameplay, and stunning visuals. It's a must-have for any serious gamer looking for the ultimate gaming experience.",
        price: 599.99,
        offerPrice: 499.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/dd3l13vfoartrgbvkkh5.webp",
        ],
        category: "Accessories", // Correct this category if it's a gaming console
        date: 1738667503075,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f70c3f34a77b6dde9156", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Canon EOS R5",
        description: "The Canon EOS R5 is a game-changing mirrorless camera with a 45MP full-frame sensor, offering ultra-high resolution and the ability to shoot 8K video. Whether you're capturing professional-quality stills or cinematic video footage, this camera delivers exceptional clarity, speed, and color accuracy. With advanced autofocus and in-body stabilization, the R5 is ideal for photographers and videographers alike.",
        price: 4199.99,
        offerPrice: 3899.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/r5h370zuujvrw461c6wy.webp",
        ],
        category: "Camera",
        date: 1738667788883,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f7c93f34a77b6dde915a", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "MacBook Pro 16",
        description: "The MacBook Pro 16, powered by Apple's M2 Pro chip, offers outstanding performance with 16GB RAM and a 512GB SSD. Whether you're editing high-resolution video, developing software, or multitasking with ease, this laptop can handle the toughest tasks. It features a stunning Retina display with True Tone technology, making it a top choice for professionals in creative industries or anyone who demands premium performance in a portable form.",
        price: 2799.99,
        offerPrice: 2499.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/rzri7kytphxalrm9rubd.webp",
        ],
        category: "Laptop",
        date: 1738667977644,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f8363f34a77b6dde915c", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Sony WF-1000XM5",
        description: "Sony WF-1000XM5 true wireless earbuds deliver immersive sound with Hi-Res Audio and advanced noise cancellation technology. Designed for comfort and quality, they provide a stable, snug fit for a secure listening experience. Whether you're working out or traveling, these earbuds will keep you connected with the world around you while enjoying rich, clear sound.",
        price: 349.99,
        offerPrice: 299.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/e3zjaupyumdkladmytke.webp",
        ],
        category: "Earphone",
        date: 1738668086331,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f85e3f34a77b6dde915e", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Samsung Projector 4k",
        description: "The Samsung 4K Projector offers an immersive cinematic experience with ultra-high-definition visuals and realistic color accuracy. Equipped with a built-in speaker, it delivers rich sound quality to complement its stunning 4K resolution. Perfect for movie nights, gaming, or presentations, this projector is the ultimate choice for creating an at-home theater experience or professional setting.",
        price: 1699.99,
        offerPrice: 1499.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/qqdcly8a8vkyciy9g0bw.webp",
        ],
        category: "Accessories", // Correct this category if it's a projector
        date: 1738668126660,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1fa4b3f34a77b6dde9166", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "ASUS ROG Zephyrus G16",
        description: "The ASUS ROG Zephyrus G16 gaming laptop is powered by the Intel Core i9 processor and features an RTX 4070 GPU, delivering top-tier gaming and performance. With 16GB of RAM and a 1TB SSD, this laptop is designed for gamers who demand extreme power, speed, and storage. Equipped with a stunning 16-inch display, it's built to handle the most demanding titles and applications with ease.",
        price: 2199.99,
        offerPrice: 1999.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/wig1urqgnkeyp4t2rtso.webp",
        ],
        category: "Laptop",
        date: 1738668619198,
        rating: 4.5,
        // __v: 0,
    },
];

export const userDummyData: User = {
    id: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw", // Changed _id to id
    name: "GreatStack",
    email: "admin@example.com",
    imageUrl:
        "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18ycnlnUnFiUDBYT2dEZ2h1ZmRXcGlpdWV5OXoiLCJyaWQiOiJ1c2VyXzJzWkZIUzFVSUl5c0p5RFZ6Q3BRaFVoVElodyJ9",
    cartItems: {
        // "67a1f4e43f34a77b6dde9144": 3 // Example item in cart, uncomment if needed
    },
    // __v: 0,
};

export const orderDummyData: Order[] = [
    {
        id: "67a20934b3db72db5cc77b2b", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        items: [
            {
                product: {
                    id: "67a1f4e43f34a77b6dde9144", // Changed _id to id
                    userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
                    name: "Apple AirPods Pro",
                    description: "Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C) provide excellent sound, active noise cancellation, and a comfortable fit. The USB-C case ensures quick charging, and they pair seamlessly with Apple devices for an effortless audio experience.",
                    price: 499.99,
                    offerPrice: 399.99,
                    image: [
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/lrllaprpos2pnp5c9pyy.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/jqotgy2rvm36vfjv6lxl.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/niw7tqxvjsxt7wcehxeo.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/h8cq4x9cfzqzwaiarvpk.png",
                    ],
                    category: "Earphone",
                    date: 1738667236865,
                    // __v: 0,
                },
                quantity: 1,
                id: "67a20934b3db72db5cc77b2c", // Changed _id to id
            },
        ],
        amount: 406.99,
        address: {
            id: "67a1e4233f34a77b6dde9055", // Changed _id to id
            userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
            fullName: "GreatStack",
            phoneNumber: "0123456789",
            pincode: 654321,
            area: "Main Road , 123 Street, G Block",
            city: "City",
            state: "State",
            // __v: 0,
        },
        status: "Order Placed",
        date: 1738672426822,
        // __v: 0,
    },
    {
        id: "67a20949b3db72db5cc77b2e", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        items: [
            {
                product: {
                    id: "67a1f52e3f34a77b6dde914a", // Changed _id to id
                    userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
                    name: "Bose QuietComfort 45",
                    description: "The Bose QuietComfort 45 headphones are engineered for exceptional sound quality and unparalleled noise cancellation. With a 24-hour battery life and comfortable, lightweight design, these headphones deliver premium audio for any environment. Whether on a flight, in the office, or at home, the Bose QC45 blocks out distractions, offering an immersive listening experience.",
                    price: 429.99,
                    offerPrice: 329.99,
                    image: [
                        "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/m16coelz8ivkk9f0nwrz.webp",
                    ],
                    category: "Headphone",
                    date: 1738667310300,
                    // __v: 0,
                },
                quantity: 1,
                id: "67a20949b3db72db5cc77b2f", // Changed _id to id
            },
        ],
        amount: 335.99,
        address: {
            id: "67a1e4233f34a77b6dde9055", // Changed _id to id
            userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
            fullName: "GreatStack",
            phoneNumber: "0123456789",
            pincode: 654321,
            area: "Main Road , 123 Street, G Block",
            city: "City",
            state: "State",
            // __v: 0,
        },
        status: "Order Placed",
        date: 1738672448031,
        // __v: 0,
    },
    {
        id: "67a209bab3db72db5cc77b34", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        items: [
            {
                product: {
                    id: "67a1f4e43f34a77b6dde9144", // Changed _id to id
                    userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
                    name: "Apple AirPods Pro",
                    description: "Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C) provide excellent sound, active noise cancellation, and a comfortable fit. The USB-C case ensures quick charging, and they pair seamlessly with Apple devices for an effortless audio experience.",
                    price: 499.99,
                    offerPrice: 399.99,
                    image: [
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/lrllaprpos2pnp5c9pyy.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/jqotgy2rvm36vfjv6lxl.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/niw7tqxvjsxt7wcehxeo.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/h8cq4x9cfzqzwaiarvpk.png",
                    ],
                    category: "Earphone",
                    date: 1738667236865,
                    // __v: 0,
                },
                quantity: 1,
                id: "67a209bab3db72db5cc77b35", // Changed _id to id
            },
        ],
        amount: 406.99,
        address: {
            id: "67a1e4233f34a77b6dde9055", // Changed _id to id
            userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
            fullName: "GreatStack",
            phoneNumber: "0123456789",
            pincode: 654321,
            area: "Main Road , 123 Street, G Block",
            city: "City",
            state: "State",
            // __v: 0,
        },
        status: "Order Placed",
        date: 1738672560698,
        // __v: 0,
    },
];
