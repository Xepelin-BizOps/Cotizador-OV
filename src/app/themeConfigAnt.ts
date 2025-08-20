import type { ThemeConfig } from "antd";

export const themeConfigAnt: ThemeConfig = {
    token: {
        colorPrimary: '#555eee',
        colorPrimaryHover: '#7177ed',
        colorPrimaryBorder: '#555eee',
        boxShadow: '#555eee',
        colorPrimaryActive: '#494bd4',
        colorPrimaryTextHover: '#555eee',
        colorBgSpotlight: '#555eee', // Fondo del tooltip,
        borderRadius: 10
    },
    components: {
        Spin: {
            // colorWhite: '#c103d7',
            fontSize: 18,
            // colorText: '#c103d7',
            // colorTextLightSolid: '#c103d7',
            marginXXS: 7,
            marginXS: 10
        },
        DatePicker: {
            colorPrimary: '#555eee'
        }
    }
}