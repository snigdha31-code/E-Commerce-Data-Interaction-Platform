import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './App.css';
import electronics from './1.jpeg';
import img2 from './2.jpeg';
import img3 from './3.jpeg';
import img4 from './4.jpeg';
import img5 from './5.jpeg';

const CardSlideshow = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const cards = [
    { image: electronics, width: '1100px', height: '500px' },
    { image: img2, width: '1100px', height: '500px' },
    { image: img3, width: '1100px', height: '500px' },
    { image: img4, width: '1100px', height: '500px' },
    { image: img5, width: '1100px', height: '500px' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((currentCard + 1) % cards.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentCard, cards.length]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
  };

  return (
    <Slider {...settings}>
      {cards.map((card, index) => (
        <div key={index}>
          <img
            src={card.image}
            style={{ width: card.width, height: card.height }}
            alt={`Card ${index + 1}`}
          />
        </div>
      ))}
    </Slider>
  );
};

export default CardSlideshow;
