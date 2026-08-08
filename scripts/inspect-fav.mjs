import sharp from 'sharp'
import fs from 'fs'

const src =
  'C:/Users/Leonm/AppData/Roaming/Cursor/User/workspaceStorage/1786035915124/images/logo_upscaled_4x-6b958e90-71b2-464a-92e1-371e6e0d89ea.png'

const meta = await sharp(src).metadata()
console.log('src', meta.width, meta.height, meta.format, meta.hasAlpha)
