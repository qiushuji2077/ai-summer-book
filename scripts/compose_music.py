"""Original instrumental cue: Window light. No samples or third-party recording."""
from pathlib import Path
import numpy as np
import wave, subprocess

root = Path(__file__).resolve().parents[1]
rate=32000
beat=60/58
bar=4*beat
duration=32*bar+6
mix=np.zeros((int(duration*rate),2),dtype=np.float64)
rng=np.random.default_rng(28)

def tone(midi, start, velocity=.13, length=5.5, pan=0):
    freq=440*2**((midi-69)/12)
    t=np.arange(int(length*rate))/rate
    y=np.zeros_like(t)
    for n,a in [(1,1),(2,.27),(3,.085),(4,.024),(5,.008)]:
        y += a*np.sin(2*np.pi*freq*n*(1+.00004*n*n)*t)*np.exp(-t*(.64+.23*n))
    envelope=(1-np.exp(-t/0.024))*(1-np.exp(-(length-t)/.14))
    y*=envelope*velocity
    index=int(start*rate); end=min(index+len(y),len(mix)); y=y[:end-index]
    mix[index:end,0]+=y*np.sqrt((1-pan)/2)
    mix[index:end,1]+=y*np.sqrt((1+pan)/2)

chords=[(48,[60,64,67,71]),(47,[59,62,67,69]),(45,[57,60,64,71]),(41,[57,60,64,67]),(50,[57,60,65,69]),(43,[55,60,62,67]),(48,[60,64,67,74]),(41,[57,60,64,67])]
melodies=[[76,74,71,67],[74,71,69,None],[72,71,69,64],[69,67,64,None],[69,72,74,72],[71,69,67,None],[76,74,71,67],[69,67,64,None]]
for k in range(16):
    base=k*2*bar
    bass,notes=chords[k%8]
    tone(bass,base,.105,8.0,-.12)
    tone(bass+12,base+4*beat,.056,5,.08)
    for j in range(8):
        note=notes[[0,2,1,3,0,2,1,2][j]]
        tone(note,base+j*beat+.10,.055+rng.uniform(-.007,.007),5.5,(-.23 if j%2 else .23))
    for j,n in enumerate(melodies[k%8]):
        if n is not None: tone(n+(0 if k<8 else -12),base+(j*2+.45)*beat,.072 if k<8 else .065,6,.1)

# Quiet stereo reflections, with no rhythmic percussion.
dry=mix.copy()
for delay,gain in [(.117,.13),(.231,.09),(.367,.055),(.523,.04)]:
    shift=int(delay*rate);mix[shift:]+=dry[:-shift,::-1]*gain
fade=int(3*rate);mix[:fade]*=np.linspace(0,1,fade)[:,None]
fadeout=int(7*rate);mix[-fadeout:]*=np.linspace(1,0,fadeout)[:,None]
peak=np.max(np.abs(mix));mix*=.67/max(peak,.001)
pcm=(mix*32767).astype('<i2')
temp=Path('/workspace/scratch/3efba6500d49/window-light.wav')
with wave.open(str(temp),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm.tobytes())
target=root/'dist/assets/window-light.mp3'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(temp),'-codec:a','libmp3lame','-b:a','128k','-metadata','title=Window light','-metadata','comment=Original procedural composition for this book',str(target)],check=True)
print({'duration_seconds':round(duration,1),'peak':round(float(np.max(np.abs(mix))),3),'bytes':target.stat().st_size})
