import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {IntlProvider} from 'use-intl';
import GoodsCarousel from '@/components/ui/shared/GoodsCarouselWithImage';
import messages from '../../vympel_front/src/messages/ru.json';
import fixture from './harness-items.json';
const missing=new URLSearchParams(location.search).get('missing');
if(missing&&['IntersectionObserver','ResizeObserver','MutationObserver'].includes(missing))Object.defineProperty(window,missing,{value:undefined,configurable:true});
function Harness(){const [items,setItems]=useState(fixture);return <IntlProvider locale="ru" messages={messages}>
 <button id="short" onClick={()=>setItems(fixture.slice(0,2))}>Short</button><button id="empty" onClick={()=>setItems([])}>Empty</button><button id="restore" onClick={()=>setItems(fixture)}>Restore</button><button id="reorder" onClick={()=>setItems([...fixture].reverse())}>Reorder</button>
 <section id="first"><GoodsCarousel items={items} showBanner={false}/></section><section id="second"><GoodsCarousel items={fixture} showBanner={false}/></section>
 </IntlProvider>;}
createRoot(document.getElementById('app')!).render(<Harness/>);
