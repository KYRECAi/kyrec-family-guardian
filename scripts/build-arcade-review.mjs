/** Isolated review of the actual arcade player, never a bypass in app routes. */
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const project = process.cwd();
const root = path.join(project, "artifacts/arcade-review");
await mkdir(root, { recursive: true });
await writeFile(path.join(root, "index.html"), '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await writeFile(path.join(root, "main.tsx"), `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArcadePlayer } from '@/components/arcade-player';
import '@/styles.css';
const reviewStyle=document.createElement('style');reviewStyle.textContent='.guardian-arcade{height:100%;min-height:0}';document.head.append(reviewStyle);
function Review(){
 const [game,setGame]=useState('moneybags'); const [width,setWidth]=useState(390); const [height,setHeight]=useState(844);
 const [best,setBest]=useState({moneybags:0,valentine:0}); const [visible,setVisible]=useState(true);
 return <div style={{display:'grid',justifyItems:'center',gap:12,padding:12,background:'#ede9f4'}}>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
 <button onClick={()=>{setGame('moneybags');setVisible(true)}}>Moneybags</button>
 <button onClick={()=>{setGame('valentine');setVisible(true)}}>Valentine Crush</button>
 <button onClick={()=>{setWidth(320);setHeight(568)}}>Small phone</button>
 <button onClick={()=>{setWidth(390);setHeight(844)}}>iPhone</button>
 <button onClick={()=>{setWidth(820);setHeight(1000)}}>iPad</button>
 <button onClick={()=>{setWidth(844);setHeight(390)}}>Landscape</button>
 </div>
 <div style={{width,maxWidth:'100%',height}}>
 {visible?<ArcadePlayer key={game} game={game} best={best[game]} gameUrl={location.origin+(game==='valentine'?'/valentine/':'/')}
 onClose={()=>setVisible(false)} onScore={(id,score)=>setBest(old=>({...old,[id]:Math.max(old[id],score)}))}/>:<button onClick={()=>setVisible(true)}>Return to game</button>}
 </div></div>
}
createRoot(document.getElementById('root')).render(<Review/>);
`);
await build({ configFile: false, root, base: "/_qa/", plugins: [react(),tailwind()],
  resolve: { alias: { "@": path.join(project, "src") } },
  build: { outDir: path.join(project, "../../game-release-preview/dist/_qa"), emptyOutDir: true },
});
