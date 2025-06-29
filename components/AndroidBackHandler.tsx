import { useEffect } from 'react'
import { BackHandler, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'

interface AndroidBackHandlerProps {
  onBackPress?: () => boolean
  enabled?: boolean
}

export function useAndroidBackHandler({ onBackPress, enabled = true }: AndroidBackHandlerProps = {}) {
  const navigation = useNavigation()

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) {
      return
    }

    const backAction = () => {
      if (onBackPress) {
        return onBackPress()
      }
      
      // Default behavior - go back if possible
      if (navigation.canGoBack()) {
        navigation.goBack()
        return true
      }
      
      // Let system handle if we can't go back (will exit app)
      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    )

    return () => backHandler.remove()
  }, [navigation, onBackPress, enabled])
}

// Higher-order component for wrapping screens
export function withAndroidBackHandler<T extends {}>(
  Component: React.ComponentType<T>,
  onBackPress?: () => boolean
) {
  return function AndroidBackHandlerWrapper(props: T) {
    useAndroidBackHandler({ onBackPress })
    return <Component {...props} />
  }
}

export default useAndroidBackHandler